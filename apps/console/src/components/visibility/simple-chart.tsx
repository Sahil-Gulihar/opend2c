"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { PerformancePoint } from "@/lib/visibility-data";

type SimpleChartProps = {
  data: PerformancePoint[];
  showImpressions?: boolean;
  showClicks?: boolean;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export function SimpleChart({
  data,
  showImpressions = true,
  showClicks = true,
}: SimpleChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9334e6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#9334e6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="0" />

        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickMargin={8}
          interval={3}
        />

        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickFormatter={fmt}
          width={36}
        />

        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          itemStyle={{ color: "#374151" }}
          formatter={(value) => fmt(Number(value))}
          cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
        />

        {showImpressions && (
          <Area
            dataKey="impressions"
            type="linear"
            stroke="#9334e6"
            strokeWidth={1.5}
            fill="url(#gradImpressions)"
            dot={false}
            activeDot={{ r: 3, fill: "#9334e6", strokeWidth: 0 }}
          />
        )}

        {showClicks && (
          <Area
            dataKey="clicks"
            type="linear"
            stroke="#1a73e8"
            strokeWidth={1.5}
            fill="url(#gradClicks)"
            dot={false}
            activeDot={{ r: 3, fill: "#1a73e8", strokeWidth: 0 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
