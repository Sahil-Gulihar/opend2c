"use client";

import { useState } from "react";

const DATE_RANGES = [
  { label: "7D", value: "7d" },
  { label: "28D", value: "28d" },
  { label: "3MO", value: "3mo" },
];

type TopbarProps = {
  title?: string;
};

export function Topbar({ title }: TopbarProps) {
  const [dateRange, setDateRange] = useState("28d");

  return (
    <div className="h-14 shrink-0 bg-[#f0f4fa] flex items-center justify-between px-8">
      {title && (
        <span className="text-sm font-medium text-gray-700">{title}</span>
      )}
      {!title && <div />}

      <div className="flex items-center gap-3">
        {/* Date range selector */}
        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDateRange(r.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                dateRange === r.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              } ${r.value !== "7d" ? "border-l border-gray-200" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Export */}
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" />

        {/* Avatar */}
        <button className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 hover:bg-gray-300 transition-colors">
          A
        </button>
      </div>
    </div>
  );
}
