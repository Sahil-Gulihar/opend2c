import type { ProductStatus } from "@/lib/visibility-data";

const CONFIG: Record<ProductStatus, { label: string; className: string; dotClass: string }> = {
  indexed: {
    label: "Indexed",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  not_indexed: {
    label: "Not Indexed",
    className: "text-gray-500 bg-gray-50 border-gray-200",
    dotClass: "bg-gray-400",
  },
  error: {
    label: "Error",
    className: "text-red-600 bg-red-50 border-red-200",
    dotClass: "bg-red-500",
  },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const { label, className, dotClass } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
      {label}
    </span>
  );
}
