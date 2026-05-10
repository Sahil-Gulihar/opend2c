# Zerops as a Database Gateway

## The Problem

Zerops runs all its services — including Postgres — inside a private VPC. Machines outside that network (like Vercel serverless functions) cannot open a TCP connection to the database directly. A `DATABASE_URL` pointing at a Zerops Postgres host will time out from Vercel, no matter what.

```
Vercel function  ──TCP 5432──▶  Zerops Postgres   ✗  (blocked at network edge)
```

This is not a bug. It is the correct default for a production database. The problem is that you still need your Vercel app to read and write data.

---

## The Solution: Backend-as-Gateway

Deploy a small HTTP service **inside** Zerops. It sits next to the database on the same private network, so it can reach Postgres over a plain internal hostname. Vercel talks to this service over public HTTPS. The service translates HTTP requests into SQL and returns JSON.

```
Vercel function  ──HTTPS──▶  Zerops API service  ──TCP 5432──▶  Zerops Postgres
                              (inside the VPC)                   (inside the VPC)
```

Every database operation is now a typed HTTP call. Vercel never touches Postgres.

This pattern already exists in this repo — the **crawler worker** is exactly this. It exposes `/jobs`, `/jobs/:id`, and `/jobs/:id/events`, and Vercel calls those. The only step is to extend the same pattern to cover the rest of the application data (brands, products, users).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Zerops VPC                                             │
│                                                         │
│  ┌──────────────────┐       ┌───────────────────────┐  │
│  │  api service     │──────▶│  Postgres             │  │
│  │  (Go HTTP)       │  TCP  │  (internal hostname)  │  │
│  │  api.zerops      │  5432 │  db.zerops             │  │
│  └──────────────────┘       └───────────────────────┘  │
│          ▲                                              │
│          │ public HTTPS (zerops subdomain or custom)    │
└──────────┼──────────────────────────────────────────────┘
           │
  ┌────────────────┐
  │  Vercel        │
  │  console app   │
  └────────────────┘
```

Authentication between Vercel and the Zerops API uses a shared `API_SECRET` — a random string set as an env var on both sides. The API service checks `Authorization: Bearer <secret>` on every request, the same way the crawler already does.

---

## Implementation

### 1. Zerops service (`workers/api`)

A single Go binary. Thin HTTP layer over Postgres. No ORM.

**`zerops.yml`**

```yaml
zerops:
  - setup: api
    build:
      base: go@1
      buildCommands:
        - go get github.com/jackc/pgx/v5
        - go mod tidy
        - go build -o api .
      deployFiles: api

    run:
      base: go@1
      ports:
        - port: 8080
          httpSupport: true
      # DATABASE_URL is an internal Zerops hostname — never leaves the VPC
      # API_SECRET must match the same var on Vercel
      envVariables:
        DATABASE_URL: ${db_connectionString}   # injected by Zerops from the db service
        ALLOWED_ORIGINS: https://console.opend2c.com
        # API_SECRET: set as a secret variable via Zerops GUI
      start: ./api
```

> `${db_connectionString}` is a Zerops cross-service reference. Zerops resolves it at runtime to the internal connection string of whichever Postgres service you name `db`. It never appears in logs or source code.

**`main.go` (skeleton)**

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"

    "github.com/jackc/pgx/v5/pgxpool"
)

var db *pgxpool.Pool

func main() {
    var err error
    db, err = pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatalf("db: %v", err)
    }
    if err := db.Ping(context.Background()); err != nil {
        log.Fatalf("db ping: %v", err)
    }

    mux := http.NewServeMux()
    mux.HandleFunc("/health",      cors(handleHealth))
    mux.HandleFunc("/brands",      cors(requireAuth(handleBrands)))
    mux.HandleFunc("/brands/",     cors(requireAuth(handleBrands)))
    mux.HandleFunc("/products",    cors(requireAuth(handleProducts)))
    mux.HandleFunc("/products/",   cors(requireAuth(handleProducts)))

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    log.Printf("api listening on :%s", port)
    log.Fatal(http.ListenAndServe(":"+port, mux))
}
```

`requireAuth` and `cors` are identical to what the crawler already has in `main.go`. Copy them directly.

---

### 2. Vercel side (`apps/console`)

**`src/lib/api.ts`** — one shared fetch wrapper

```ts
const API_URL = (process.env.API_URL ?? "http://localhost:8081").replace(/\/$/, "");
const API_SECRET = process.env.API_SECRET ?? "";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_SECRET}`,
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`api ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}
```

Usage anywhere in the console:

```ts
import { apiRequest } from "@/lib/api";

const brands = await apiRequest<Brand[]>("/brands");
const brand  = await apiRequest<Brand>("/brands/my-slug");
```

**Vercel env vars**

```
API_URL=https://api.opend2c.com      # your Zerops service public URL
API_SECRET=<same value as Zerops>
```

**`turbo.json`** — add to the `env` array so Vercel passes them through Turborepo:

```json
"env": ["API_URL", "API_SECRET", ...]
```

---

### 3. Env var summary

| Where | Variable | Value |
|---|---|---|
| Zerops API service | `DATABASE_URL` | `${db_connectionString}` (internal, auto-injected) |
| Zerops API service | `API_SECRET` | `openssl rand -hex 32` (set as Zerops secret) |
| Zerops API service | `ALLOWED_ORIGINS` | `https://console.opend2c.com` |
| Vercel console | `API_URL` | `https://api.opend2c.com` |
| Vercel console | `API_SECRET` | same secret as above |

---

## What this gives you

- **The database never has a public port.** There is nothing to brute-force or accidentally expose.
- **One place to add auth, rate-limiting, or row-level security logic** — the API service — instead of scattering it across Vercel route handlers.
- **The crawler already proves this works.** The new API service is the same pattern, just for application data instead of crawl jobs.
- **Local dev still works.** Point `API_URL` at `localhost:8081` and run the Go service locally against a local Postgres. No tunnel needed.

## What this costs you

- One more service to deploy and maintain on Zerops.
- HTTP overhead on every database call (single-digit milliseconds on the same continent).
- You write explicit HTTP handlers instead of calling `db.query` directly from Next.js. This is more code upfront but makes the data contract explicit and testable.
