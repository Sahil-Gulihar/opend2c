package main

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"
)

// ---- Crawl runner ----

func processJob(ctx context.Context, jobID string) {
	j, err := dbGetJob(jobID)
	if err != nil {
		log.Printf("[job %s] load failed: %v", jobID, err)
		dbSetError(jobID, err.Error())
		return
	}

	dbSetStatus(jobID, StatusRunning)
	publishProgress(ctx, jobID, ProgressEvent{Type: "running"})

	scraped, skipped, total := 0, 0, 0

	for _, site := range j.Sites {
		if scraped >= j.MaxProducts {
			break
		}

		sitemaps, err := getProductSitemaps(site)
		if err != nil {
			log.Printf("[job %s] sitemap error for %s: %v", jobID, site, err)
			continue
		}

		shopName := shopLabel(site)

		for _, sm := range sitemaps {
			if scraped >= j.MaxProducts {
				break
			}

			entries, err := getProductURLs(sm)
			if err != nil {
				log.Printf("[job %s] sitemap parse error: %v", jobID, err)
				continue
			}

			total += len(entries)
			dbUpdateProgress(jobID, scraped, skipped, total)
			publishProgress(ctx, jobID, ProgressEvent{
				Type: "progress", Scraped: scraped, Skipped: skipped, Total: total,
			})

			for _, entry := range entries {
				if scraped >= j.MaxProducts {
					break
				}

				p, err := scrapeProduct(entry, shopName)
				if err != nil {
					log.Printf("[job %s] skip %s: %v", jobID, entry.Loc, err)
					skipped++
					dbUpdateProgress(jobID, scraped, skipped, total)
					continue
				}

				pid, err := dbInsertProduct(jobID, p)
				if err != nil {
					log.Printf("[job %s] db insert: %v", jobID, err)
					continue
				}
				dbInsertVariants(pid, p.Variants)

				scraped++
				dbUpdateProgress(jobID, scraped, skipped, total)
				publishProgress(ctx, jobID, ProgressEvent{
					Type: "progress", Scraped: scraped, Skipped: skipped, Total: total, Product: p,
				})
			}
		}
	}

	dbSetStatus(jobID, StatusDone)
	publishProgress(ctx, jobID, ProgressEvent{
		Type: "done", Scraped: scraped, Skipped: skipped, Total: total,
	})
	log.Printf("[job %s] done: %d scraped, %d skipped", jobID, scraped, skipped)

	go syncJobToConsole(jobID)
}

// syncJobToConsole pushes completed job products to the console's scraper_products
// table so they appear on the public marketplace.
func syncJobToConsole(jobID string) {
	consoleURL := os.Getenv("CONSOLE_URL")
	if consoleURL == "" {
		log.Printf("[sync %s] CONSOLE_URL not set, skipping sync", jobID)
		return
	}
	secret := os.Getenv("WORKER_SECRET")

	products, err := dbGetProducts(jobID)
	if err != nil {
		log.Printf("[sync %s] fetch products: %v", jobID, err)
		return
	}

	type syncProduct struct {
		SourceURL string  `json:"source_url"`
		Title     string  `json:"title"`
		Image     *string `json:"image"`
		Shop      string  `json:"shop"`
		Price     *string `json:"price"`
		Currency  *string `json:"currency"`
	}

	var payload struct {
		JobID    string        `json:"jobId"`
		Products []syncProduct `json:"products"`
	}
	payload.JobID = jobID
	for _, p := range products {
		sp := syncProduct{
			Title: p.Name,
			Shop:  p.Shop,
		}
		if p.Image != "" {
			sp.Image = &p.Image
		}
		v := p.First()
		if v.URL != "" {
			sp.SourceURL = v.URL
		}
		if v.Price != "" {
			sp.Price = &v.Price
		}
		if v.Currency != "" {
			sp.Currency = &v.Currency
		}
		if sp.SourceURL == "" {
			continue // skip products with no URL
		}
		payload.Products = append(payload.Products, sp)
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest(http.MethodPost,
		strings.TrimRight(consoleURL, "/")+"/api/crawler/sync",
		strings.NewReader(string(body)),
	)
	if err != nil {
		log.Printf("[sync %s] build request: %v", jobID, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+secret)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[sync %s] request failed: %v", jobID, err)
		return
	}
	defer resp.Body.Close()
	log.Printf("[sync %s] console sync → %d (%d products)", jobID, resp.StatusCode, len(payload.Products))
}

func workerLoop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case jobID := <-jobQueue:
			log.Printf("dequeued job %s", jobID)
			go processJob(ctx, jobID)
		}
	}
}

// ---- HTTP helpers ----

// allowedOrigins returns the set of permitted CORS origins from the
// ALLOWED_ORIGINS env var (comma-separated). Falls back to "*" when unset so
// local dev works without extra config.
func allowedOrigins() map[string]bool {
	raw := os.Getenv("ALLOWED_ORIGINS")
	if raw == "" {
		return nil // nil == allow all
	}
	set := make(map[string]bool)
	for _, o := range strings.Split(raw, ",") {
		if s := strings.TrimSpace(o); s != "" {
			set[s] = true
		}
	}
	return set
}

var originSet = allowedOrigins()

func cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if originSet == nil {
			// Dev mode — allow everything
			w.Header().Set("Access-Control-Allow-Origin", "*")
		} else if origin != "" && originSet[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		} else if origin != "" {
			// Known-bad origin — reject preflight immediately
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusForbidden)
				return
			}
			// Let the browser enforce for non-preflight; don't set the header
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

// requireAuth validates the shared WORKER_SECRET.
//
// Callers must send one of:
//   - Header:         Authorization: Bearer <secret>
//   - Query param:    ?token=<secret>   (needed for browser EventSource which
//                     cannot set custom headers)
//
// The secret is read from the WORKER_SECRET env var. If the var is empty the
// server refuses all requests with 500 so misconfiguration is obvious.
func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	secret := os.Getenv("WORKER_SECRET")
	return func(w http.ResponseWriter, r *http.Request) {
		if secret == "" {
			log.Println("WORKER_SECRET is not set — refusing request")
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "server misconfigured"})
			return
		}

		// Extract token from header or query param
		token := ""
		if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
			token = strings.TrimPrefix(auth, "Bearer ")
		} else if q := r.URL.Query().Get("token"); q != "" {
			token = q
		}

		if subtle.ConstantTimeCompare([]byte(token), []byte(secret)) != 1 {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
			return
		}

		next(w, r)
	}
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

// ---- Job handlers ----

func handleCreateJob(w http.ResponseWriter, r *http.Request) {
	var req StartJobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if len(req.Sites) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sites required"})
		return
	}
	if req.MaxProducts <= 0 {
		req.MaxProducts = 500
	}

	now := time.Now()
	j := &Job{
		ID:          genID(),
		Sites:       req.Sites,
		MaxProducts: req.MaxProducts,
		Status:      StatusQueued,
		Products:    []Product{},
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := dbCreateJob(j); err != nil {
		log.Printf("db create job: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db error"})
		return
	}
	enqueueJob(j.ID)

	writeJSON(w, http.StatusCreated, j)
}

func handleGetJob(w http.ResponseWriter, r *http.Request, id string) {
	j, err := dbGetJob(id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "job not found"})
		return
	}
	j.Products, _ = dbGetProducts(id)
	writeJSON(w, http.StatusOK, j)
}

func handleListJobs(w http.ResponseWriter, r *http.Request) {
	list, err := dbListJobs()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if list == nil {
		list = []*Job{}
	}
	writeJSON(w, http.StatusOK, list)
}

// handleJobEvents streams Redis pub/sub for a job as Server-Sent Events.
func handleJobEvents(w http.ResponseWriter, r *http.Request, id string) {
	j, err := dbGetJob(id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "job not found"})
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "streaming unsupported"})
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Send a snapshot of current state immediately so the client isn't blank.
	snap, _ := json.Marshal(ProgressEvent{
		Type:    "state",
		Scraped: j.Progress.Scraped,
		Skipped: j.Progress.Skipped,
		Total:   j.Progress.Total,
	})
	fmt.Fprintf(w, "data: %s\n\n", snap)
	flusher.Flush()

	// Already finished — no need to subscribe.
	if j.Status == StatusDone || j.Status == StatusFailed {
		done, _ := json.Marshal(ProgressEvent{Type: string(j.Status)})
		fmt.Fprintf(w, "data: %s\n\n", done)
		flusher.Flush()
		return
	}

	sub := subscribe(id)
	defer unsubscribe(id, sub)

	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-heartbeat.C:
			fmt.Fprintf(w, ": ping\n\n")
			flusher.Flush()
		case msg, ok := <-sub.ch:
			if !ok {
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()

			var ev ProgressEvent
			if json.Unmarshal([]byte(msg), &ev) == nil && (ev.Type == "done" || ev.Type == "error") {
				return
			}
		}
	}
}

// ---- Router ----

func handleJobs(w http.ResponseWriter, r *http.Request) {
	// /jobs, /jobs/, /jobs/<id>, /jobs/<id>/events
	tail := strings.TrimPrefix(r.URL.Path, "/jobs")
	tail = strings.TrimPrefix(tail, "/")

	switch {
	case tail == "" || tail == "/":
		switch r.Method {
		case http.MethodGet:
			handleListJobs(w, r)
		case http.MethodPost:
			handleCreateJob(w, r)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		}

	case strings.HasSuffix(tail, "/events"):
		id := strings.TrimSuffix(tail, "/events")
		handleJobEvents(w, r, id)

	default:
		// tail is the job ID
		if r.Method == http.MethodGet {
			handleGetJob(w, r, tail)
		} else {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		}
	}
}

// ---- Main ----

func main() {
	ctx := context.Background()

	if err := initDB(); err != nil {
		log.Fatalf("postgres: %v", err)
	}
	log.Println("postgres: connected")

	go workerLoop(ctx)

	mux := http.NewServeMux()

	// /health is unauthenticated so VPS health-checks / uptime monitors work
	mux.HandleFunc("/health", cors(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}))

	// All job endpoints require a valid WORKER_SECRET
	mux.HandleFunc("/jobs", cors(requireAuth(handleJobs)))
	mux.HandleFunc("/jobs/", cors(requireAuth(handleJobs)))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port
	log.Printf("crawler worker listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func genID() string {
	b := make([]byte, 8)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(256))
		b[i] = byte(n.Int64())
	}
	return fmt.Sprintf("%x", b)
}
