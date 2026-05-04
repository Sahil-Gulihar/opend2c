type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
  up?: boolean | null;
  description?: string;
};

export function MetricCard({ label, value, change, up, description }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg px-4 py-3.5">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-gray-900 tracking-tight">{value}</p>
      {(change || description) && (
        <div className="mt-1 flex items-center gap-1">
          {change && up !== null && up !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                up ? "text-emerald-600" : "text-red-500"
              }`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={up ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {change}
            </span>
          )}
          {change && up === null && (
            <span className="text-xs text-gray-400">{change}</span>
          )}
          {description && (
            <span className="text-xs text-gray-400">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
