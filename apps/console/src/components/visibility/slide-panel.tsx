"use client";

import { useState } from "react";
import type { Product } from "@/lib/visibility-data";
import { StatusBadge } from "./status-badge";

const TABS = ["Overview", "SEO", "Issues", "Performance"] as const;
type Tab = (typeof TABS)[number];

type SlidePanelProps = {
  product: Product | null;
  onClose: () => void;
};

export function SlidePanel({ product, onClose }: SlidePanelProps) {
  const [tab, setTab] = useState<Tab>("Overview");

  const open = product !== null;

  return (
    <>
      {/* Backdrop — subtle, not full opacity */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/10"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-40 w-[420px] bg-white border-l border-gray-200 flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {product && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 mb-1">Product Detail</p>
                <h2 className="text-sm font-semibold text-gray-900 leading-snug pr-4">
                  {product.title}
                </h2>
                <p className="mt-1 text-xs text-gray-400 font-mono truncate">{product.url}</p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-5 gap-0">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2.5 pt-3 text-xs font-medium mr-5 border-b-2 transition-colors cursor-pointer ${
                    tab === t
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {tab === "Overview" && <OverviewTab product={product} />}
              {tab === "SEO" && <SEOTab product={product} />}
              {tab === "Issues" && <IssuesTab product={product} />}
              {tab === "Performance" && <PerformanceTab product={product} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-md px-4 py-1">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2 border-b border-gray-100">
        {title}
      </p>
      {children}
    </div>
  );
}

function OverviewTab({ product }: { product: Product }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <StatusBadge status={product.status} />
        <span className="text-xs text-gray-400">{product.category}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500 font-medium">{product.price}</span>
      </div>

      <Section title="Visibility">
        <Row label="Visibility Score" value={
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${product.visibilityScore > 70 ? "bg-emerald-500" : product.visibilityScore > 30 ? "bg-amber-400" : "bg-red-400"}`}
                style={{ width: `${product.visibilityScore}%` }}
              />
            </div>
            <span>{product.visibilityScore}</span>
          </div>
        } />
        <Row label="Last Crawled" value={product.lastCrawled} />
        <Row label="URL" value={<span className="font-mono text-[11px]">{product.url}</span>} />
      </Section>

      <Section title="Search Metrics">
        <Row label="Clicks (28d)" value={product.clicks.toLocaleString()} />
        <Row label="Impressions (28d)" value={product.impressions.toLocaleString()} />
        <Row label="CTR" value={`${product.ctr}%`} />
        <Row label="Avg. Position" value={product.position > 0 ? product.position.toFixed(1) : "—"} />
      </Section>

      {product.issues.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-md">
          <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs text-red-600">{product.issues.length} issue{product.issues.length > 1 ? "s" : ""} detected</span>
        </div>
      )}
    </>
  );
}

function SEOTab({ product }: { product: Product }) {
  return (
    <Section title="SEO Signals">
      <Row label="Title" value={product.title.length > 0 ? "Present" : "Missing"} />
      <Row label="Meta Description" value={product.issues.some(i => i.toLowerCase().includes("meta")) ? <span className="text-amber-600">Missing</span> : "Present"} />
      <Row label="Structured Data" value={product.issues.some(i => i.toLowerCase().includes("structured")) ? <span className="text-amber-600">Missing</span> : "Present"} />
      <Row label="Canonical Tag" value={product.issues.some(i => i.toLowerCase().includes("canonical")) ? <span className="text-amber-600">Missing</span> : "Present"} />
      <Row label="noindex" value={product.issues.some(i => i.toLowerCase().includes("noindex")) ? <span className="text-red-600">Set</span> : "Not set"} />
      <Row label="robots.txt" value={product.issues.some(i => i.toLowerCase().includes("robots")) ? <span className="text-red-600">Blocked</span> : "Allowed"} />
    </Section>
  );
}

function IssuesTab({ product }: { product: Product }) {
  if (product.issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">No issues detected</p>
        <p className="mt-1 text-xs text-gray-400">This product is healthy and fully indexed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {product.issues.map((issue, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-3 bg-red-50 border border-red-100 rounded-md">
          <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-red-700">{issue}</p>
        </div>
      ))}

      <button className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors cursor-pointer">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Request Indexing
      </button>
    </div>
  );
}

function PerformanceTab({ product }: { product: Product }) {
  const metrics = [
    { label: "Clicks", value: product.clicks.toLocaleString(), note: "Last 28 days" },
    { label: "Impressions", value: product.impressions.toLocaleString(), note: "Last 28 days" },
    { label: "CTR", value: `${product.ctr}%`, note: "Click-through rate" },
    { label: "Avg Position", value: product.position > 0 ? product.position.toFixed(1) : "—", note: "Mean ranking" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((m) => (
        <div key={m.label} className="bg-gray-50 border border-gray-100 rounded-md px-3 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{m.label}</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{m.value}</p>
          <p className="mt-0.5 text-[10px] text-gray-400">{m.note}</p>
        </div>
      ))}
    </div>
  );
}
