"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  { label?: string; color?: string }
>;

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be inside ChartContainer");
  return ctx;
}

function ChartContainer({
  config,
  children,
  className,
}: {
  config: ChartConfig;
  children: React.ReactNode;
  className?: string;
}) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, val]) => [
      `--color-${key}`,
      val.color ?? `var(--chart-1)`,
    ]),
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} style={style as React.CSSProperties}>
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartTooltip(props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return <RechartsPrimitive.Tooltip {...props} />;
}

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  className,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
  labelFormatter?: (label: string) => string;
  formatter?: (value: number, name: string) => [string, string];
  className?: string;
}) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div className={cn("rounded-lg border bg-white shadow-md px-3 py-2 text-xs", className)}>
      <p className="font-medium text-gray-700 mb-1.5">
        {labelFormatter ? labelFormatter(label ?? "") : label}
      </p>
      {payload.map((item) => {
        const cfg = config[item.name];
        const [val, name] = formatter
          ? formatter(item.value, item.name)
          : [item.value.toLocaleString(), cfg?.label ?? item.name];
        return (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: item.color ?? `var(--color-${item.name})` }}
            />
            <span className="text-gray-500">{name}</span>
            <span className="ml-auto font-semibold text-gray-900 tabular-nums">{val}</span>
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
};
