package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"html/template"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

const maxProducts = 1000
const concurrency = 1

var shopifySites = []string{
	"https://www.baarbaracoffee.com",
	"https://bluetokaicoffee.com",
	"https://www.tulum.coffee",
	"https://moxiebeauty.in",
}

// ---- XML structs ----

type SitemapIndex struct {
	Sitemaps []struct {
		Loc string `xml:"loc"`
	} `xml:"sitemap"`
}

type URLSet struct {
	URLs []URLEntry `xml:"url"`
}

type URLEntry struct {
	Loc    string       `xml:"loc"`
	Images []ImageEntry `xml:"http://www.google.com/schemas/sitemap-image/1.1 image"`
}

type ImageEntry struct {
	Loc string `xml:"http://www.google.com/schemas/sitemap-image/1.1 loc"`
}

// ---- Product ----

type Product struct {
	Name     string
	Price    string
	Currency string
	Image    string
	URL      string
	Shop     string
}

// ---- Rate-aware HTTP ----

// userAgents — realistic Chrome/Safari profiles; rotate to avoid fingerprinting on UA alone.
var userAgents = []string{
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
}

// domainState tracks rate-limit quota per origin so all workers share awareness.
type domainState struct {
	mu        sync.Mutex
	remaining int       // RateLimit-Remaining / X-RateLimit-Remaining (-1 = unknown)
	resetAt   time.Time // when remaining refills
}

var (
	domainsMu sync.Mutex
	domains   = map[string]*domainState{}
)

func getDomainState(rawURL string) *domainState {
	u, _ := url.Parse(rawURL)
	host := u.Host
	domainsMu.Lock()
	defer domainsMu.Unlock()
	if ds, ok := domains[host]; ok {
		return ds
	}
	ds := &domainState{remaining: -1}
	domains[host] = ds
	return ds
}

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
	// let Go's transport auto-handle gzip; don't set Accept-Encoding manually
}

// jitter returns a random duration in [minMs, maxMs) milliseconds.
func jitter(minMs, maxMs int) time.Duration {
	return time.Duration(minMs+rand.Intn(maxMs-minMs)) * time.Millisecond
}

// parseRetryAfter reads the Retry-After header: either seconds or HTTP date.
func parseRetryAfter(h http.Header) time.Duration {
	v := h.Get("Retry-After")
	if v == "" {
		return 0
	}
	if secs, err := strconv.Atoi(v); err == nil {
		return time.Duration(secs)*time.Second + jitter(500, 1500)
	}
	if t, err := http.ParseTime(v); err == nil {
		d := time.Until(t)
		if d > 0 {
			return d + jitter(500, 1500)
		}
	}
	return 5 * time.Second
}

// updateDomainState reads RateLimit-* / X-RateLimit-* headers and stores them.
func updateDomainState(ds *domainState, h http.Header) {
	remaining := -1
	for _, key := range []string{"RateLimit-Remaining", "X-RateLimit-Remaining"} {
		if v := h.Get(key); v != "" {
			if n, err := strconv.Atoi(v); err == nil {
				remaining = n
				break
			}
		}
	}

	var resetAt time.Time
	for _, key := range []string{"RateLimit-Reset", "X-RateLimit-Reset"} {
		if v := h.Get(key); v != "" {
			// can be epoch seconds or HTTP date
			if secs, err := strconv.ParseInt(v, 10, 64); err == nil {
				resetAt = time.Unix(secs, 0)
			} else if t, err := http.ParseTime(v); err == nil {
				resetAt = t
			}
			break
		}
	}

	ds.mu.Lock()
	ds.remaining = remaining
	if !resetAt.IsZero() {
		ds.resetAt = resetAt
	}
	ds.mu.Unlock()
}

func fetch(targetURL string) ([]byte, error) {
	ds := getDomainState(targetURL)
	const maxRetries = 6

	for attempt := 0; attempt < maxRetries; attempt++ {
		// --- pre-request pacing ---
		ds.mu.Lock()
		rem := ds.remaining
		resetAt := ds.resetAt
		ds.mu.Unlock()

		switch {
		case rem == 0 && !resetAt.IsZero() && time.Now().Before(resetAt):
			// quota exhausted — wait until the window resets
			wait := time.Until(resetAt) + jitter(500, 1500)
			fmt.Printf("  quota exhausted, sleeping %v until reset\n", wait.Round(time.Second))
			time.Sleep(wait)
		case rem > 0 && rem < 8:
			// running low — add extra breathing room
			extra := jitter(2000, 4000)
			fmt.Printf("  %d requests remaining, slowing down (%v extra)\n", rem, extra.Round(time.Millisecond))
			time.Sleep(extra)
		default:
			// normal inter-request jitter: 1.5 – 4 s
			time.Sleep(jitter(1500, 4000))
		}

		data, status, headers, err := doFetch(targetURL)
		if err != nil {
			return nil, err
		}

		updateDomainState(ds, headers)

		if status == 429 {
			wait := parseRetryAfter(headers)
			if wait == 0 {
				// no header — exponential backoff: 4, 8, 16, 32, 64 s
				wait = time.Duration(4<<uint(attempt))*time.Second + jitter(0, 3000)
			}
			fmt.Printf("  429 on %s — backing off %v (attempt %d/%d)\n",
				targetURL, wait.Round(time.Second), attempt+1, maxRetries)
			time.Sleep(wait)
			continue
		}

		if status != 200 {
			return nil, fmt.Errorf("HTTP %d for %s", status, targetURL)
		}
		return data, nil
	}
	return nil, fmt.Errorf("gave up after %d retries: %s", maxRetries, targetURL)
}

func doFetch(targetURL string) ([]byte, int, http.Header, error) {
	req, _ := http.NewRequest("GET", targetURL, nil)
	ua := userAgents[rand.Intn(len(userAgents))]
	req.Header = http.Header{
		"User-Agent":                []string{ua},
		"Accept":                    []string{"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"},
		"Accept-Language":           []string{"en-US,en;q=0.9"},
		"Connection":                []string{"keep-alive"},
		"Upgrade-Insecure-Requests": []string{"1"},
		"Sec-Fetch-Dest":            []string{"document"},
		"Sec-Fetch-Mode":            []string{"navigate"},
		"Sec-Fetch-Site":            []string{"none"},
		"Sec-Fetch-User":            []string{"?1"},
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, 0, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, resp.StatusCode, resp.Header, nil
	}
	data, err := io.ReadAll(resp.Body)
	return data, resp.StatusCode, resp.Header, err
}

// ---- Sitemap parsing ----

func getProductSitemaps(baseURL string) ([]string, error) {
	data, err := fetch(baseURL + "/sitemap.xml")
	if err != nil {
		return nil, err
	}
	var index SitemapIndex
	if err := xml.Unmarshal(data, &index); err != nil {
		return nil, err
	}
	var out []string
	for _, s := range index.Sitemaps {
		if strings.Contains(s.Loc, "sitemap_products") {
			out = append(out, s.Loc)
		}
	}
	return out, nil
}

func getProductURLs(sitemapURL string) ([]URLEntry, error) {
	data, err := fetch(sitemapURL)
	if err != nil {
		return nil, err
	}
	var urlset URLSet
	if err := xml.Unmarshal(data, &urlset); err != nil {
		return nil, err
	}
	return urlset.URLs, nil
}

// ---- Product page scraping ----

func extractLDJSON(html string) string {
	for {
		start := strings.Index(html, `application/ld+json`)
		if start == -1 {
			return ""
		}
		open := strings.Index(html[start:], "{")
		if open == -1 {
			return ""
		}
		open += start

		depth, end := 0, open
		for i := open; i < len(html); i++ {
			switch html[i] {
			case '{':
				depth++
			case '}':
				depth--
				if depth == 0 {
					end = i + 1
					goto found
				}
			}
		}
		html = html[start+1:]
		continue
	found:
		candidate := html[open:end]
		if strings.Contains(candidate, `"Product"`) {
			return candidate
		}
		html = html[end:]
	}
}

func scrapeProduct(entry URLEntry, shopName string) (*Product, error) {
	data, err := fetch(entry.Loc)
	if err != nil {
		return nil, err
	}

	jsonStr := extractLDJSON(string(data))
	if jsonStr == "" {
		return nil, fmt.Errorf("no ld+json Product block")
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
		return nil, err
	}

	var name string
	if v, ok := raw["name"]; ok {
		json.Unmarshal(v, &name)
	}
	if name == "" {
		return nil, fmt.Errorf("no product name")
	}

	price, currency := extractOffer(raw["offers"])

	image := ""
	if len(entry.Images) > 0 {
		image = entry.Images[0].Loc
	} else if v, ok := raw["image"]; ok {
		image = extractImageURL(v)
	}

	return &Product{
		Name:     name,
		Price:    price,
		Currency: currency,
		Image:    image,
		URL:      entry.Loc,
		Shop:     shopName,
	}, nil
}

func extractOffer(raw json.RawMessage) (price, currency string) {
	if raw == nil {
		return
	}
	pick := func(m map[string]interface{}) {
		if p, ok := m["price"]; ok {
			price = strings.TrimSuffix(fmt.Sprintf("%v", p), ".0")
		}
		if c, ok := m["priceCurrency"]; ok {
			currency = fmt.Sprintf("%v", c)
		}
	}
	var arr []map[string]interface{}
	if json.Unmarshal(raw, &arr) == nil && len(arr) > 0 {
		pick(arr[0])
		return
	}
	var obj map[string]interface{}
	if json.Unmarshal(raw, &obj) == nil {
		pick(obj)
	}
	return
}

func extractImageURL(raw json.RawMessage) string {
	if raw == nil {
		return ""
	}
	var s string
	if json.Unmarshal(raw, &s) == nil {
		return s
	}
	var obj map[string]interface{}
	if json.Unmarshal(raw, &obj) == nil {
		if u, ok := obj["url"]; ok {
			return fmt.Sprintf("%v", u)
		}
	}
	return ""
}

// ---- HTML output ----

const htmlTmpl = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Products ({{len .}})</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f2f2f2; padding: 24px; }
h1 { text-align: center; font-size: 26px; color: #111; margin-bottom: 6px; }
.sub { text-align: center; color: #777; font-size: 13px; margin-bottom: 32px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; max-width: 1400px; margin: 0 auto; }
.card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,.08); display: flex; flex-direction: column; transition: transform .15s, box-shadow .15s; }
.card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.13); }
.card img { width: 100%; height: 195px; object-fit: cover; background: #eee; }
.no-img { height: 195px; background: #eee; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 12px; }
.body { padding: 12px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
.shop { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #999; }
.name { font-size: 13px; color: #1a1a1a; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
.price { font-size: 17px; font-weight: 700; color: #2d6a4f; }
.buy { display: block; text-align: center; background: #111; color: #fff; text-decoration: none; padding: 9px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-top: 4px; transition: background .15s; }
.buy:hover { background: #333; }
</style>
</head>
<body>
<h1>Products</h1>
<p class="sub">{{len .}} products scraped</p>
<div class="grid">
{{range .}}
<div class="card">
  {{if .Image}}<img src="{{.Image}}" alt="{{.Name}}" loading="lazy">
  {{else}}<div class="no-img">No image</div>{{end}}
  <div class="body">
    <span class="shop">{{.Shop}}</span>
    <span class="name">{{.Name}}</span>
    <span class="price">{{if .Price}}{{.Currency}} {{.Price}}{{else}}—{{end}}</span>
    <a class="buy" href="{{.URL}}" target="_blank" rel="noopener">Buy Now ↗</a>
  </div>
</div>
{{end}}
</div>
</body>
</html>`

// ---- Main ----

func main() {
	rand.New(rand.NewSource(time.Now().UnixNano()))

	var (
		products []Product
		mu       sync.Mutex
		wg       sync.WaitGroup
		count    atomic.Int32
	)

	sem := make(chan struct{}, concurrency)

	for _, site := range shopifySites {
		if int(count.Load()) >= maxProducts {
			break
		}

		fmt.Printf("\n→ %s\n", site)
		sitemaps, err := getProductSitemaps(site)
		if err != nil {
			fmt.Printf("  sitemap error: %v\n", err)
			continue
		}
		fmt.Printf("  found %d product sitemap(s)\n", len(sitemaps))

		shopName := shopLabel(site)

		for _, sm := range sitemaps {
			if int(count.Load()) >= maxProducts {
				break
			}
			entries, err := getProductURLs(sm)
			if err != nil {
				fmt.Printf("  sitemap parse error: %v\n", err)
				continue
			}

			for _, entry := range entries {
				if int(count.Load()) >= maxProducts {
					break
				}

				wg.Add(1)
				sem <- struct{}{}
				go func(e URLEntry, shop string) {
					defer wg.Done()
					defer func() { <-sem }()

					if int(count.Load()) >= maxProducts {
						return
					}
					p, err := scrapeProduct(e, shop)
					if err != nil {
						return
					}
					mu.Lock()
					if int(count.Load()) < maxProducts {
						products = append(products, *p)
						n := count.Add(1)
						fmt.Printf("  [%3d] %-50s %s %s\n", n, truncate(p.Name, 50), p.Currency, p.Price)
					}
					mu.Unlock()
				}(entry, shopName)
			}
		}
	}

	wg.Wait()
	fmt.Printf("\nScraped %d products. Writing products.html…\n", len(products))

	tmpl := template.Must(template.New("p").Parse(htmlTmpl))
	f, err := os.Create("products.html")
	if err != nil {
		fmt.Println("create file:", err)
		os.Exit(1)
	}
	defer f.Close()
	if err := tmpl.Execute(f, products); err != nil {
		fmt.Println("template:", err)
		os.Exit(1)
	}
	fmt.Println("Done! Open products.html in your browser.")
}

func shopLabel(site string) string {
	s := strings.TrimPrefix(strings.TrimPrefix(site, "https://"), "www.")
	return strings.Split(s, ".")[0]
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n-1] + "…"
}
