"use client";

import { useState, useMemo } from "react";
import { PRODUCTS } from "@/lib/visibility-data";
import type { Product, ProductStatus } from "@/lib/visibility-data";
import { StatusBadge } from "@/components/visibility/status-badge";
import { SlidePanel } from "@/components/visibility/slide-panel";

const STATUS_FILTERS: { label: string; value: ProductStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Indexed", value: "indexed" },
  { label: "Not Indexed", value: "not_indexed" },
  { label: "Error", value: "error" },
];

type SortField = "title" | "clicks" | "impressions" | "ctr" | "position" | "visibilityScore";
type SortDir = "asc" | "desc";

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) {
    return (
      <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    );
  }
  return (
    <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === "desc" ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
    </svg>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "clicks",
    dir: "desc",
  });

  const handleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "desc" ? "asc" : "desc" }
        : { field, dir: "desc" }
    );
  };

  const filtered = useMemo(() => {
    let rows = [...PRODUCTS];

    if (statusFilter !== "all") {
      rows = rows.filter((p) => p.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.url.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      const diff =
        typeof aVal === "string" ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sort.dir === "desc" ? -diff : diff;
    });

    return rows;
  }, [search, statusFilter, sort]);

  const counts = useMemo(() => ({
    all: PRODUCTS.length,
    indexed: PRODUCTS.filter((p) => p.status === "indexed").length,
    not_indexed: PRODUCTS.filter((p) => p.status === "not_indexed").length,
    error: PRODUCTS.filter((p) => p.status === "error").length,
  }), []);

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide select-none cursor-pointer hover:text-gray-600 transition-colors";
  const thRightClass = `${thClass} text-right`;

  return (
    <>
      <div className={`px-10 py-8 transition-all duration-200 ${selectedProduct ? "mr-[420px]" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Products</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} ·{" "}
              {counts.indexed} indexed · {counts.error} with errors
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-5">
          {/* Status tabs */}
          <div className="flex items-center gap-0 border border-gray-200 rounded-md overflow-hidden">
            {STATUS_FILTERS.map((f) => {
              const count = f.value === "all" ? counts.all : counts[f.value];
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === f.value
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  } ${f.value !== "all" ? "border-l border-gray-200" : ""}`}
                >
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      statusFilter === f.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 w-56 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className={thClass} onClick={() => handleSort("title")} style={{ width: "30%" }}>
                    <span className="flex items-center gap-1">
                      Product <SortIcon field="title" current={sort.field} dir={sort.dir} />
                    </span>
                  </th>
                  <th className={thClass} style={{ width: "22%" }}>
                    URL
                  </th>
                  <th className={thClass} onClick={() => handleSort("visibilityScore")} style={{ width: "12%" }}>
                    <span className="flex items-center gap-1">
                      Status <SortIcon field="visibilityScore" current={sort.field} dir={sort.dir} />
                    </span>
                  </th>
                  <th className={thClass} style={{ width: "10%" }}>
                    Last Crawled
                  </th>
                  <th className={thRightClass} onClick={() => handleSort("visibilityScore")} style={{ width: "11%" }}>
                    <span className="flex items-center justify-end gap-1">
                      Score <SortIcon field="visibilityScore" current={sort.field} dir={sort.dir} />
                    </span>
                  </th>
                  <th className={thRightClass} onClick={() => handleSort("clicks")} style={{ width: "8%" }}>
                    <span className="flex items-center justify-end gap-1">
                      Clicks <SortIcon field="clicks" current={sort.field} dir={sort.dir} />
                    </span>
                  </th>
                  <th className={thRightClass} onClick={() => handleSort("impressions")} style={{ width: "7%" }}>
                    <span className="flex items-center justify-end gap-1">
                      Impr. <SortIcon field="impressions" current={sort.field} dir={sort.dir} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-xs text-gray-400">
                      No products match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map((product) => {
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <tr
                      key={product.id}
                      onClick={() =>
                        setSelectedProduct(isSelected ? null : product)
                      }
                      className={`border-b border-gray-50 cursor-pointer transition-colors last:border-0 ${
                        isSelected
                          ? "bg-blue-50"
                          : "hover:bg-[#f0f4ff]/60"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-gray-900 leading-snug">
                          {product.title}
                        </span>
                        {product.issues.length > 0 && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-red-500">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {product.issues.length}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] font-mono text-gray-400 truncate block max-w-[180px]">
                          {product.url}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {product.lastCrawled}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1 w-14 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                product.visibilityScore > 70
                                  ? "bg-emerald-400"
                                  : product.visibilityScore > 30
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                              }`}
                              style={{ width: `${product.visibilityScore}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-gray-700 w-5 text-right">
                            {product.visibilityScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-gray-700">
                        {product.clicks > 0 ? product.clicks.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-gray-500">
                        {product.impressions > 0 ? product.impressions.toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <p className="mt-3 text-xs text-gray-400 text-right">
            Showing {filtered.length} of {PRODUCTS.length} products
          </p>
        )}
      </div>

      <SlidePanel
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
