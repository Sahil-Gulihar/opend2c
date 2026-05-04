"use client";

import { useState, useMemo } from "react";
import { SimpleChart } from "@/components/visibility/simple-chart";
import { StatusBadge } from "@/components/visibility/status-badge";
import {
  OVERVIEW_METRICS,
  PERFORMANCE_DATA,
  PRODUCTS,
  TOP_QUERIES,
} from "@/lib/visibility-data";

type MetricKey = "clicks" | "impressions" | "ctr" | "position";

const METRICS: {
  key: MetricKey;
  label: string;
  value: string;
  change: string;
  up: boolean | null;
  activeClass: string;
  lineColor: string;
}[] = [
  {
    key: "clicks",
    label: "Total clicks",
    value: OVERVIEW_METRICS.clicks.value,
    change: OVERVIEW_METRICS.clicks.change,
    up: OVERVIEW_METRICS.clicks.up,
    activeClass: "bg-[#1a73e8] text-white",
    lineColor: "#1a73e8",
  },
  {
    key: "impressions",
    label: "Total impressions",
    value: OVERVIEW_METRICS.impressions.value,
    change: OVERVIEW_METRICS.impressions.change,
    up: OVERVIEW_METRICS.impressions.up,
    activeClass: "bg-[#9334e6] text-white",
    lineColor: "#9334e6",
  },
  {
    key: "ctr",
    label: "Average CTR",
    value: OVERVIEW_METRICS.ctr.value,
    change: OVERVIEW_METRICS.ctr.change,
    up: OVERVIEW_METRICS.ctr.up,
    activeClass: "bg-[#e52592] text-white",
    lineColor: "#e52592",
  },
  {
    key: "position",
    label: "Average position",
    value: OVERVIEW_METRICS.avgPosition.value,
    change: OVERVIEW_METRICS.avgPosition.change,
    up: OVERVIEW_METRICS.avgPosition.up,
    activeClass: "bg-[#12a37a] text-white",
    lineColor: "#12a37a",
  },
];

const TABS = ["Queries", "Pages", "Countries", "Devices", "Search appearance", "Days"] as const;
type Tab = (typeof TABS)[number];

function CheckboxIcon({ checked, color }: { checked: boolean; color: string }) {
  if (checked) {
    return (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

export default function OverviewPage() {
  const [active, setActive] = useState<Set<MetricKey>>(new Set(["clicks", "impressions"]));
  const [tab, setTab] = useState<Tab>("Queries");

  const toggle = (key: MetricKey) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const TOP_PRODUCTS_BY_CLICKS = useMemo(
    () => [...PRODUCTS].sort((a, b) => b.clicks - a.clicks).slice(0, 10),
    []
  );

  return (
    <div className="px-6 py-5 max-w-[1200px]">
      {/* Metric toggle cards */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-0 bg-white divide-x divide-gray-200">
        {METRICS.map((m) => {
          const isActive = active.has(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={`flex-1 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                isActive ? m.activeClass : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <CheckboxIcon checked={isActive} color={m.lineColor} />
                <span className={`text-xs font-medium ${isActive ? "text-white/90" : "text-gray-500"}`}>
                  {m.label}
                </span>
              </div>
              <p className={`text-2xl font-semibold tracking-tight ${isActive ? "text-white" : "text-gray-900"}`}>
                {m.value}
              </p>
              <div className="mt-1 flex items-center gap-0.5">
                {m.up !== null && (
                  <svg className={`h-3 w-3 ${isActive ? "text-white/70" : m.up ? "text-emerald-500" : "text-red-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={m.up ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                )}
                <span className={`text-xs ${isActive ? "text-white/70" : m.up ? "text-emerald-600" : m.up === false ? "text-red-500" : "text-gray-400"}`}>
                  {m.change}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg px-5 py-4 mb-4">
        <SimpleChart
          data={PERFORMANCE_DATA}
          showImpressions={active.has("impressions")}
          showClicks={active.has("clicks")}
        />
      </div>

      {/* Tabs + Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 mr-5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                tab === t
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        {tab === "Queries" && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Top queries</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 w-28">
                  <span className="flex items-center justify-end gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    Clicks
                  </span>
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 w-32">Impressions</th>
              </tr>
            </thead>
            <tbody>
              {TOP_QUERIES.map((q, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 last:border-0 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-800">{q.query}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums text-gray-700">{q.clicks.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums text-gray-500">{q.impressions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "Pages" && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Top pages</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 w-28">
                  <span className="flex items-center justify-end gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    Clicks
                  </span>
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 w-32">Impressions</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS_BY_CLICKS.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 last:border-0 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-gray-800 font-mono truncate max-w-[400px]">{p.url}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums text-gray-700">{p.clicks > 0 ? p.clicks.toLocaleString() : "—"}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums text-gray-500">{p.impressions > 0 ? p.impressions.toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(tab === "Countries" || tab === "Devices" || tab === "Search appearance" || tab === "Days") && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-gray-400">No data available for this view yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
