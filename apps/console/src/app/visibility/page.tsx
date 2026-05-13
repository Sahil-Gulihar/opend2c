"use client";

import { useEffect, useState } from "react";

type TopProduct = {
  id: number;
  title: string;
  shop: string;
  source_url: string;
  click_count: number;
};

type ClickAnalytics = {
  totalClicks: number;
  totalProducts: number;
  activeProducts: number;
  topProducts: TopProduct[];
};

function truncateWords(text: string, n: number) {
  const words = text.split(/\s+/);
  return words.length <= n ? text : words.slice(0, n).join(" ") + "…";
}

export default function OverviewPage() {
  const [data, setData] = useState<ClickAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d: ClickAnalytics) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalClicks   = data?.totalClicks   ?? 0;
  const activeProducts = data?.activeProducts ?? 0;
  const topProducts   = data?.topProducts   ?? [];

  return (
    <div className="px-6 py-5 max-w-[1200px]">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Total clicks</p>
          <p className="text-3xl font-semibold text-gray-900 tabular-nums">
            {loading ? "—" : totalClicks.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">across all products</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Active products</p>
          <p className="text-3xl font-semibold text-gray-900 tabular-nums">
            {loading ? "—" : activeProducts.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">listed on marketplace</p>
        </div>
      </div>

      {/* Top clicked products */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Top products by clicks</h2>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading…</div>
        ) : topProducts.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No clicks recorded yet. Clicks will appear here once visitors interact with products.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Product</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Shop</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 w-24">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-900 hover:text-blue-600 font-medium"
                    >
                      {truncateWords(p.title, 6)}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{p.shop}</td>
                  <td className="px-5 py-3 text-right text-sm tabular-nums font-semibold text-gray-900">
                    {p.click_count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
