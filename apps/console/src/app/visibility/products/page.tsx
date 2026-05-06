"use client";

import { useEffect, useMemo, useState } from "react";

type ProductStatus = "draft" | "active" | "archived";

type Product = {
  id: number;
  sitemap_id: number;
  source_url: string;
  title: string;
  image: string | null;
  shop: string;
  price: string | null;
  currency: string | null;
  status: ProductStatus;
  notes: string;
  updated_at: string;
};

const FILTERS: Array<ProductStatus | "all"> = ["all", "draft", "active", "archived"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [checked, setChecked]   = useState<Set<number>>(new Set());
  const [query, setQuery]       = useState("");
  const [filter, setFilter]     = useState<ProductStatus | "all">("all");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [bulking, setBulking]   = useState(false);
  const [error, setError]       = useState("");

  async function loadProducts() {
    const res = await fetch("/api/scraper/products", { cache: "no-store" });
    if (!res.ok) { setError("Could not load products"); setLoading(false); return; }
    const rows: Product[] = await res.json();
    setProducts(rows);
    setSelected((cur) => rows.find((r) => r.id === cur?.id) ?? cur);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchStatus = filter === "all" || p.status === filter;
      const matchQuery  = !q || p.title.toLowerCase().includes(q) || p.shop.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [products, query, filter]);

  const counts = useMemo(() => ({
    all:      products.length,
    draft:    products.filter((p) => p.status === "draft").length,
    active:   products.filter((p) => p.status === "active").length,
    archived: products.filter((p) => p.status === "archived").length,
  }), [products]);

  const allFilteredChecked = filtered.length > 0 && filtered.every((p) => checked.has(p.id));
  const someChecked = checked.size > 0;

  function toggleAll() {
    if (allFilteredChecked) {
      setChecked((prev) => { const next = new Set(prev); filtered.forEach((p) => next.delete(p.id)); return next; });
    } else {
      setChecked((prev) => { const next = new Set(prev); filtered.forEach((p) => next.add(p.id)); return next; });
    }
  }

  function toggleOne(id: number) {
    setChecked((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  async function bulkUpdate(status: ProductStatus) {
    const ids = [...checked];
    if (ids.length === 0) return;
    setBulking(true);
    const res = await fetch("/api/scraper/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status }),
    });
    setBulking(false);
    if (!res.ok) { setError("Bulk update failed"); return; }
    setChecked(new Set());
    await loadProducts();
  }

  async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    const res = await fetch("/api/scraper/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selected.id,
        title: form.get("title"),
        price: form.get("price"),
        currency: form.get("currency"),
        status: form.get("status"),
        notes: form.get("notes"),
      }),
    });
    setSaving(false);
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? "Could not update"); return; }
    const updated: Product = await res.json();
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
  }

  return (
    <div className="px-8 py-6 h-full flex gap-5 overflow-hidden">
      <section className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} visible · {counts.active} active · {counts.draft} draft
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="w-72 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                  filter === item ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item} {counts[item]}
              </button>
            ))}
          </div>

          {someChecked && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{checked.size} selected</span>
              <button
                onClick={() => bulkUpdate("active")}
                disabled={bulking}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {bulking ? "Updating…" : "Make active"}
              </button>
              <button
                onClick={() => bulkUpdate("draft")}
                disabled={bulking}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Set draft
              </button>
              <button
                onClick={() => bulkUpdate("archived")}
                disabled={bulking}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Archive
              </button>
              <button
                onClick={() => setChecked(new Set())}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 min-h-0">
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">Loading products…</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                No products found. Add a sitemap in Sitemaps first.
              </div>
            ) : (
              <table className="w-full min-w-[760px]">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="pl-4 pr-2 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={allFilteredChecked}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-gray-900 focus:ring-0"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Shop</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
                        selected?.id === product.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="pl-4 pr-2 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked.has(product.id)}
                          onChange={() => toggleOne(product.id)}
                          className="rounded border-gray-300 text-gray-900 focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(product)}>
                        <div className="flex items-center gap-3 min-w-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="h-10 w-10 rounded-md object-cover bg-gray-100 shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                            <p className="text-xs text-gray-400 truncate">{product.source_url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 cursor-pointer" onClick={() => setSelected(product)}>{product.shop}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-gray-700 cursor-pointer" onClick={() => setSelected(product)}>
                        {product.price ? `${product.currency ?? ""} ${product.price}`.trim() : "—"}
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(product)}>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                          product.status === "active"   ? "bg-emerald-100 text-emerald-700" :
                          product.status === "archived" ? "bg-gray-100 text-gray-400" :
                                                          "bg-gray-100 text-gray-600"
                        }`}>
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <aside className="w-[380px] shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden">
        {selected ? (
          <form onSubmit={saveProduct} className="h-full flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Edit product</h2>
              <p className="mt-1 text-xs text-gray-400 truncate">{selected.source_url}</p>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <label className="block">
                <span className="text-xs font-medium text-gray-700">Title</span>
                <input name="title" defaultValue={selected.title} required
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Price</span>
                  <input name="price" defaultValue={selected.price ?? ""}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Currency</span>
                  <input name="currency" defaultValue={selected.currency ?? ""}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-gray-700">Status</span>
                <select name="status" defaultValue={selected.status}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-700">Notes</span>
                <textarea name="notes" defaultValue={selected.notes} rows={5}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
                Close
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="h-full flex items-center justify-center px-8 text-center text-sm text-gray-400">
            Select a product to edit, or use checkboxes to bulk update status.
          </div>
        )}
      </aside>
    </div>
  );
}
