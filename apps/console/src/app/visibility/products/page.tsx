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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProducts() {
    const res = await fetch("/api/scraper/products", { cache: "no-store" });
    if (!res.ok) {
      setError("Could not load products");
      setLoading(false);
      return;
    }
    const rows: Product[] = await res.json();
    setProducts(rows);
    setSelected((current) => rows.find((row) => row.id === current?.id) ?? current);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus = filter === "all" || product.status === filter;
      const matchesQuery =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.source_url.toLowerCase().includes(q) ||
        product.shop.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [products, query, filter]);

  const counts = useMemo(() => {
    return {
      all: products.length,
      draft: products.filter((product) => product.status === "draft").length,
      active: products.filter((product) => product.status === "active").length,
      archived: products.filter((product) => product.status === "archived").length,
    };
  }, [products]);

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

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not update product");
      return;
    }

    const updated: Product = await res.json();
    setProducts((prev) => prev.map((product) => (product.id === updated.id ? updated : product)));
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search scraped products"
            className="w-72 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          {FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                filter === item
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.replace("_", " ")} {counts[item]}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 min-h-0">
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">Loading products...</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                No products found. Add a sitemap in Scraper first.
              </div>
            ) : (
              <table className="w-full min-w-[760px]">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
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
                      onClick={() => setSelected(product)}
                      className={`border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 ${
                        selected?.id === product.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="h-10 w-10 rounded-md object-cover bg-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                            <p className="text-xs text-gray-400 truncate">{product.source_url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{product.shop}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-gray-700">
                        {product.price ? `${product.currency ?? ""} ${product.price}`.trim() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-600">
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
                <input
                  name="title"
                  defaultValue={selected.title}
                  required
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Price</span>
                  <input
                    name="price"
                    defaultValue={selected.price ?? ""}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Currency</span>
                  <input
                    name="currency"
                    defaultValue={selected.currency ?? ""}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Status</span>
                <select
                  name="status"
                  defaultValue={selected.status}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Notes</span>
                <textarea
                  name="notes"
                  defaultValue={selected.notes}
                  rows={5}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </label>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="h-full flex items-center justify-center px-8 text-center text-sm text-gray-400">
            Select a product to update its title, price, status, or internal notes.
          </div>
        )}
      </aside>
    </div>
  );
}
