import { Download } from "google-material-icons/outlined";

type TopbarProps = {
  title?: string;
};

export function Topbar({ title }: TopbarProps) {
  return (
    <div className="h-14 shrink-0 bg-[#f0f4fa] flex items-center justify-between px-8">
      {title && (
        <span className="text-sm font-medium text-gray-700">{title}</span>
      )}
      {!title && <div />}

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <Download size={16} color="currentColor" />
          Export
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <button className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 hover:bg-gray-300 transition-colors">
          A
        </button>
      </div>
    </div>
  );
}
