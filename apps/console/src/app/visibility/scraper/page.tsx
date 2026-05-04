"use client";

import { useEffect, useState } from "react";

type Sitemap = {
  id: number;
  url: string;
  status: "queued" | "running" | "done" | "failed";
  product_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

const statusClass: Record<Sitemap["status"], string> = {
  queued: "bg-gray-100 text-gray-600",
  running: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-600",
};

export default function ScraperPage() {
  const [url, setUrl] = useState("");
  const [sitemaps, setSitemaps] = useState<Sitemap[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSitemaps() {
    const res = await fetch("/api/scraper/sitemaps", { cache: "no-store" });
    if (!res.ok) {
      setError("Could not load sitemaps");
      setLoading(false);
      return;
    }
    setSitemaps(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadSitemaps();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/scraper/sitemaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not scrape sitemap");
      setSaving(false);
      return;
    }

    setUrl("");
    await loadSitemaps();
    setSaving(false);
  }

  return (
    <div className="px-8 py-6 max-w-[1100px] space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Scraper</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a product sitemap, save it, and pull discovered products into your product table.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-lg p-5">
        <label htmlFor="sitemap-url" className="block text-xs font-medium text-gray-700 mb-2">
          Sitemap URL
        </label>
        <div className="flex gap-2">
          <input
            id="sitemap-url"
            type="url"
            required
            placeholder="https://store.example.com/sitemap_products_1.xml"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Scraping..." : "Add sitemap"}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Saved sitemaps
          </span>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading sitemaps...</div>
        ) : sitemaps.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No sitemaps saved yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sitemaps.map((sitemap) => (
              <div key={sitemap.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{sitemap.url}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {sitemap.product_count} products · {new Date(sitemap.created_at).toLocaleString()}
                  </p>
                  {sitemap.error && <p className="mt-1 text-xs text-red-500">{sitemap.error}</p>}
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass[sitemap.status]}`}
                >
                  {sitemap.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

