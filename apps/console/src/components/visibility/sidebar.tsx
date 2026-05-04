"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AccountTree,
  Add,
  BarChart,
  Check,
  Dashboard,
  Inventory2,
  Logout,
  ManageSearch,
  Science,
  Settings,
  TravelExplore,
} from "google-material-icons/outlined";

type IconComponent = React.ComponentType<{
  className?: string;
  color?: string;
  size?: string | number;
}>;

type NavItem = {
  label: string;
  href: string;
  Icon: IconComponent;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/visibility", Icon: Dashboard },
  { label: "Products", href: "/visibility/products", Icon: Inventory2 },
  {
    label: "URL Inspection",
    href: "/visibility/url-inspection",
    Icon: ManageSearch,
  },
  { label: "Sitemaps", href: "/visibility/sitemaps", Icon: AccountTree },
  { label: "Performance", href: "/visibility/performance", Icon: BarChart },
  { label: "Scraper", href: "/visibility/scraper", Icon: TravelExplore },
  { label: "Crawl", href: "/visibility/crawl", Icon: Science },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Settings", href: "/visibility/settings", Icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [storeOpen, setStoreOpen] = React.useState(false);

  const isActive = (href: string) =>
    href === "/visibility" ? pathname === "/visibility" : pathname.startsWith(href);

  return (
    <aside className="w-64 shrink-0 bg-[#f0f4fa] flex flex-col overflow-y-auto">
      <div className="px-5 py-5 border-b border-black/5">
        <span className="text-lg font-semibold text-gray-900 tracking-tight">Open D2C</span>
      </div>

      <div className="px-4 py-3.5 border-b border-black/5 relative">
        <button
          onClick={() => setStoreOpen((value) => !value)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-5 w-5 rounded bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-emerald-700">BE</span>
            </div>
            <span className="truncate font-medium text-gray-800">Brahmaputra Estates</span>
          </div>
          <span
            className={`text-gray-400 shrink-0 transition-transform ${storeOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>

        {storeOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl shadow-lg border border-black/5 py-1.5 z-50">
            <div className="px-3 py-2 flex items-center gap-2.5">
              <div className="h-5 w-5 rounded bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-emerald-700">BE</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Brahmaputra Estates</span>
              <Check size={16} color="currentColor" className="text-blue-600 ml-auto" />
            </div>
            <div className="my-1 border-t border-black/5" />
            <button
              onClick={() => setStoreOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Add size={16} color="currentColor" className="text-gray-400" />
              Add store
            </button>
            <div className="my-1 border-t border-black/5" />
            <Link
              href="/login"
              onClick={() => setStoreOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <Logout size={16} color="currentColor" />
              Sign out
            </Link>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-black/5 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(item.href)} compact />
        ))}
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  active,
  compact = false,
}: {
  item: NavItem;
  active: boolean;
  compact?: boolean;
}) {
  const Icon = item.Icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-full font-medium transition-colors ${
        compact ? "px-2 py-1 text-base" : "px-4 py-2.5 text-base"
      } ${
        active
          ? "bg-[#c2e7ff] text-gray-900"
          : "text-gray-800 hover:bg-black/5 hover:text-gray-900"
      }`}
    >
      <Icon
        size={18}
        color="currentColor"
        className={active ? "text-gray-900" : "text-gray-500"}
      />
      {item.label}
    </Link>
  );
}
