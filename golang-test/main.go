package main

import (
	"bufio"
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
	"time"
)

const maxProducts = 1000
const concurrency = 1

var shopifySites = []string{
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

// ---- Product structs ----

type Variant struct {
	Label    string `json:"label"`
	Price    string `json:"price"`
	Currency string `json:"currency"`
	URL      string `json:"url"`
}

func (v Variant) DisplayPrice() string {
	if v.Currency != "" {
		return v.Currency + " " + v.Price
	}
	return v.Price
}

type Product struct {
	Name     string    `json:"name"`
	Image    string    `json:"image"`
	Shop     string    `json:"shop"`
	Variants []Variant `json:"variants"`
}

func (p Product) First() Variant {
	if len(p.Variants) == 0 {
		return Variant{}
	}
	return p.Variants[0]
}

func (p Product) Multi() bool {
	return len(p.Variants) > 1
}

// ---- Rate-aware HTTP ----

var userAgents = []string{
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
}

type domainState struct {
	mu        sync.Mutex
	remaining int
	resetAt   time.Time
}

var (
	domainsMu sync.Mutex
	domains   = map[string]*domainState{}
)

func getDomainState(rawURL string) *domainState {
	u, _ := url.Parse(rawURL)
	domainsMu.Lock()
	defer domainsMu.Unlock()
	if ds, ok := domains[u.Host]; ok {
		return ds
	}
	ds := &domainState{remaining: -1}
	domains[u.Host] = ds
	return ds
}

var httpClient = &http.Client{Timeout: 30 * time.Second}

func jitter(minMs, maxMs int) time.Duration {
	return time.Duration(minMs+rand.Intn(maxMs-minMs)) * time.Millisecond
}

func parseRetryAfter(h http.Header) time.Duration {
	v := h.Get("Retry-After")
	if v == "" {
		return 0
	}
	if secs, err := strconv.Atoi(v); err == nil {
		return time.Duration(secs)*time.Second + jitter(500, 1500)
	}
	if t, err := http.ParseTime(v); err == nil {
		if d := time.Until(t); d > 0 {
			return d + jitter(500, 1500)
		}
	}
	return 5 * time.Second
}

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

// fetchSitemap uses a short delay — sitemaps are XML, rarely rate-limited.
func fetchSitemap(targetURL string) ([]byte, error) {
	return fetchWithDelay(targetURL, 300, 700)
}

// fetch uses a longer delay for product HTML pages.
func fetch(targetURL string) ([]byte, error) {
	return fetchWithDelay(targetURL, 900, 2200)
}

func fetchWithDelay(targetURL string, minMs, maxMs int) ([]byte, error) {
	ds := getDomainState(targetURL)
	const maxRetries = 6

	for attempt := 0; attempt < maxRetries; attempt++ {
		ds.mu.Lock()
		rem, resetAt := ds.remaining, ds.resetAt
		ds.mu.Unlock()

		switch {
		case rem == 0 && !resetAt.IsZero() && time.Now().Before(resetAt):
			wait := time.Until(resetAt) + jitter(500, 1500)
			fmt.Printf("  quota exhausted, sleeping %v\n", wait.Round(time.Second))
			time.Sleep(wait)
		case rem > 0 && rem < 8:
			extra := jitter(2000, 3500)
			fmt.Printf("  %d remaining, slowing down (%v)\n", rem, extra.Round(time.Millisecond))
			time.Sleep(extra)
		default:
			time.Sleep(jitter(minMs, maxMs))
		}

		data, status, headers, err := doFetch(targetURL)
		if err != nil {
			return nil, err
		}
		updateDomainState(ds, headers)

		if status == 429 {
			wait := parseRetryAfter(headers)
			if wait == 0 {
				wait = time.Duration(4<<uint(attempt))*time.Second + jitter(0, 3000)
			}
			fmt.Printf("  429 — backing off %v (attempt %d/%d)\n", wait.Round(time.Second), attempt+1, maxRetries)
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
	req.Header = http.Header{
		"User-Agent":                []string{userAgents[rand.Intn(len(userAgents))]},
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
	data, err := fetchSitemap(baseURL + "/sitemap.xml")
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
	data, err := fetchSitemap(sitemapURL)
	if err != nil {
		return nil, err
	}
	var urlset URLSet
	if err := xml.Unmarshal(data, &urlset); err != nil {
		return nil, err
	}
	return urlset.URLs, nil
}

// ---- Scraping ----

// extractLDJSON scans all application/ld+json script blocks and returns the
// raw JSON of the first Product or ProductGroup it finds. Handles direct
// objects, @graph arrays, and top-level JSON arrays.
func extractLDJSON(pageHTML string) string {
	rest := pageHTML
	for {
		idx := strings.Index(rest, `application/ld+json`)
		if idx == -1 {
			return ""
		}
		// advance past the closing > of the <script> tag
		tagClose := strings.Index(rest[idx:], ">")
		if tagClose == -1 {
			return ""
		}
		bodyStart := idx + tagClose + 1
		bodyEnd := strings.Index(rest[bodyStart:], "</script>")
		if bodyEnd == -1 {
			return ""
		}
		body := strings.TrimSpace(rest[bodyStart : bodyStart+bodyEnd])
		rest = rest[bodyStart+bodyEnd:]

		if found := findProductInJSON(body); found != "" {
			return found
		}
	}
}

// findProductInJSON recursively searches a JSON value for a Product/ProductGroup object.
func findProductInJSON(raw string) string {
	raw = strings.TrimSpace(raw)
	if len(raw) == 0 {
		return ""
	}

	switch raw[0] {
	case '[':
		// JSON array — check each element
		var items []json.RawMessage
		if json.Unmarshal([]byte(raw), &items) != nil {
			return ""
		}
		for _, item := range items {
			if found := findProductInJSON(string(item)); found != "" {
				return found
			}
		}

	case '{':
		var obj map[string]json.RawMessage
		if json.Unmarshal([]byte(raw), &obj) != nil {
			return ""
		}

		// Resolve @type — can be a string or an array of strings
		atType := resolveAtType(obj["@type"])
		if atType == "Product" || atType == "ProductGroup" {
			return raw
		}

		// Descend into @graph if present
		if graphRaw, ok := obj["@graph"]; ok {
			if found := findProductInJSON(string(graphRaw)); found != "" {
				return found
			}
		}
	}
	return ""
}

// resolveAtType extracts the first meaningful type string from a raw @type value.
func resolveAtType(raw json.RawMessage) string {
	if raw == nil {
		return ""
	}
	var s string
	if json.Unmarshal(raw, &s) == nil {
		return s
	}
	var arr []string
	if json.Unmarshal(raw, &arr) == nil {
		for _, t := range arr {
			if t != "" {
				return t
			}
		}
	}
	return ""
}

func scrapeProduct(entry URLEntry, shopName string) (*Product, error) {
	data, err := fetch(entry.Loc)
	if err != nil {
		return nil, err
	}

	jsonStr := extractLDJSON(string(data))
	if jsonStr == "" {
		return nil, fmt.Errorf("no ld+json block")
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
		return nil, err
	}

	atType := resolveAtType(raw["@type"])

	var name string
	if v, ok := raw["name"]; ok {
		json.Unmarshal(v, &name)
	}
	if name == "" {
		return nil, fmt.Errorf("no product name")
	}

	// Image: sitemap first, then ld+json
	image := ""
	if len(entry.Images) > 0 {
		image = entry.Images[0].Loc
	} else if v, ok := raw["image"]; ok {
		image = extractImageURL(v)
	}

	var variants []Variant

	if atType == "ProductGroup" {
		variants = parseProductGroupVariants(name, entry.Loc, raw)
		if image == "" {
			// try first hasVariant's image
			if hv, ok := raw["hasVariant"]; ok {
				var hvs []map[string]json.RawMessage
				if json.Unmarshal(hv, &hvs) == nil && len(hvs) > 0 {
					if img, ok := hvs[0]["image"]; ok {
						image = extractImageURL(img)
					}
				}
			}
		}
	} else {
		price, currency, offerURL := extractOfferInfo(raw["offers"])
		if offerURL == "" {
			offerURL = entry.Loc
		} else {
			offerURL = resolveURL(entry.Loc, offerURL)
		}
		variants = []Variant{{Price: price, Currency: currency, URL: offerURL}}
	}

	// Drop zero-price variants
	valid := variants[:0]
	for _, v := range variants {
		if !isZeroPrice(v.Price) {
			valid = append(valid, v)
		}
	}
	if len(valid) == 0 {
		return nil, fmt.Errorf("no priced variants (skipping)")
	}

	return &Product{Name: name, Image: image, Shop: shopName, Variants: valid}, nil
}

func parseProductGroupVariants(productName, baseURL string, raw map[string]json.RawMessage) []Variant {
	hvRaw, ok := raw["hasVariant"]
	if !ok {
		return nil
	}
	var hvs []map[string]json.RawMessage
	if err := json.Unmarshal(hvRaw, &hvs); err != nil {
		return nil
	}

	seen := map[string]bool{}
	var out []Variant
	for _, hv := range hvs {
		var vName string
		if n, ok := hv["name"]; ok {
			json.Unmarshal(n, &vName)
		}
		price, currency, varURL := extractOfferInfo(hv["offers"])
		if isZeroPrice(price) {
			continue
		}
		if varURL != "" {
			varURL = resolveURL(baseURL, varURL)
		}
		label := stripPrefix(productName, vName)
		key := label + "|" + price
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, Variant{Label: label, Price: price, Currency: currency, URL: varURL})
	}
	return out
}

func extractOfferInfo(raw json.RawMessage) (price, currency, offerURL string) {
	if raw == nil {
		return
	}
	pick := func(m map[string]interface{}) {
		if p, ok := m["price"]; ok {
			s := fmt.Sprintf("%v", p)
			// normalise "685.00" → "685", "295.0" → "295"
			if f, err := strconv.ParseFloat(s, 64); err == nil {
				price = strconv.FormatFloat(f, 'f', -1, 64)
			} else {
				price = s
			}
		}
		if c, ok := m["priceCurrency"]; ok {
			currency = fmt.Sprintf("%v", c)
		}
		if u, ok := m["url"]; ok {
			offerURL = fmt.Sprintf("%v", u)
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

func isZeroPrice(price string) bool {
	if price == "" {
		return true
	}
	f, err := strconv.ParseFloat(price, 64)
	return err == nil && f == 0
}

func extractImageURL(raw json.RawMessage) string {
	if raw == nil {
		return ""
	}
	var s string
	if json.Unmarshal(raw, &s) == nil {
		return s
	}
	// array — take first
	var arr []interface{}
	if json.Unmarshal(raw, &arr) == nil && len(arr) > 0 {
		if str, ok := arr[0].(string); ok {
			return str
		}
	}
	var obj map[string]interface{}
	if json.Unmarshal(raw, &obj) == nil {
		if u, ok := obj["url"]; ok {
			return fmt.Sprintf("%v", u)
		}
	}
	return ""
}

func stripPrefix(base, variant string) string {
	if p := base + " - "; strings.HasPrefix(variant, p) {
		return variant[len(p):]
	}
	return variant
}

func resolveURL(base, ref string) string {
	if strings.HasPrefix(ref, "http") {
		return ref
	}
	b, err := url.Parse(base)
	if err != nil {
		return ref
	}
	r, err := url.Parse(ref)
	if err != nil {
		return ref
	}
	return b.ResolveReference(r).String()
}

// ---- JSONL persistence ----

func loadProducts(path string) ([]Product, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 4<<20), 4<<20) // 4 MB per line — handles large ProductGroups
	var out []Product
	for sc.Scan() {
		var p Product
		if json.Unmarshal(sc.Bytes(), &p) == nil {
			out = append(out, p)
		}
	}
	return out, sc.Err()
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
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; max-width: 1400px; margin: 0 auto; }
.card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,.08); display: flex; flex-direction: column; transition: transform .15s, box-shadow .15s; }
.card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.13); }
.card img { width: 100%; height: 200px; object-fit: cover; background: #eee; }
.no-img { height: 200px; background: #eee; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 12px; }
.body { padding: 12px; flex: 1; display: flex; flex-direction: column; gap: 7px; }
.shop { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #999; }
.name { font-size: 13px; color: #1a1a1a; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.variant-sel { width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 7px; font-size: 12px; color: #333; background: #fafafa; cursor: pointer; }
.variant-sel:focus { outline: none; border-color: #888; }
.price { font-size: 17px; font-weight: 700; color: #2d6a4f; }
.buy { display: block; text-align: center; background: #111; color: #fff; text-decoration: none; padding: 9px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-top: auto; transition: background .15s; }
.buy:hover { background: #333; }
</style>
</head>
<body>
<h1>Products</h1>
<p class="sub">{{len .}} products</p>
<div class="grid">
{{range .}}
<div class="card">
  {{if .Image}}<img src="{{.Image}}" alt="{{.Name}}" loading="lazy">
  {{else}}<div class="no-img">No image</div>{{end}}
  <div class="body">
    <span class="shop">{{.Shop}}</span>
    <span class="name">{{.Name}}</span>
    {{if .Multi}}
    <select class="variant-sel" onchange="
      var o=this.options[this.selectedIndex];
      var c=this.closest('.card');
      c.querySelector('.price').textContent=o.dataset.price;
      c.querySelector('.buy').href=o.dataset.url;
    ">
      {{range .Variants}}<option data-price="{{.DisplayPrice}}" data-url="{{.URL}}">{{.Label}}</option>
      {{end}}
    </select>
    {{end}}
    <span class="price">{{.First.DisplayPrice}}</span>
    <a class="buy" href="{{.First.URL}}" target="_blank" rel="noopener">Buy Now ↗</a>
  </div>
</div>
{{end}}
</div>
</body>
</html>`

// ---- Main ----

func main() {
	rand.New(rand.NewSource(time.Now().UnixNano()))

	jsonlOut, err := os.Create("products.jsonl")
	if err != nil {
		fmt.Println("cannot create products.jsonl:", err)
		os.Exit(1)
	}
	jsonlWriter := bufio.NewWriter(jsonlOut)

	writeProduct := func(p *Product) error {
		data, err := json.Marshal(p)
		if err != nil {
			return err
		}
		jsonlWriter.Write(data)
		jsonlWriter.WriteByte('\n')
		return jsonlWriter.Flush()
	}

	count := 0

	for _, site := range shopifySites {
		if count >= maxProducts {
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
			if count >= maxProducts {
				break
			}

			fmt.Printf("  fetching %s\n", sm)
			entries, err := getProductURLs(sm)
			if err != nil {
				fmt.Printf("  sitemap parse error: %v\n", err)
				continue
			}
			fmt.Printf("  %d product URLs — starting scrape\n\n", len(entries))

			for i, entry := range entries {
				if count >= maxProducts {
					break
				}

				fmt.Printf("  [%d/%d] %s\n", i+1, len(entries), entry.Loc)
				p, err := scrapeProduct(entry, shopName)
				if err != nil {
					fmt.Printf("         skip: %v\n", err)
					continue
				}
				if err := writeProduct(p); err != nil {
					fmt.Printf("         jsonl write error: %v\n", err)
					continue
				}
				count++
				varInfo := ""
				if len(p.Variants) > 1 {
					varInfo = fmt.Sprintf("(%d variants, from %s %s)", len(p.Variants), p.Variants[0].Currency, p.Variants[0].Price)
				} else {
					varInfo = p.Variants[0].Currency + " " + p.Variants[0].Price
				}
				fmt.Printf("         ✓ [%d] %s — %s\n", count, truncate(p.Name, 48), varInfo)
			}
		}
	}

	jsonlWriter.Flush()
	jsonlOut.Close()

	fmt.Printf("\nReading products.jsonl → generating products.html…\n")
	products, err := loadProducts("products.jsonl")
	if err != nil {
		fmt.Println("load error:", err)
		os.Exit(1)
	}

	tmpl := template.Must(template.New("p").Parse(htmlTmpl))
	htmlOut, err := os.Create("products.html")
	if err != nil {
		fmt.Println("create html:", err)
		os.Exit(1)
	}
	defer htmlOut.Close()
	if err := tmpl.Execute(htmlOut, products); err != nil {
		fmt.Println("template:", err)
		os.Exit(1)
	}

	fmt.Printf("Done! %d products → products.html\n", len(products))
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
