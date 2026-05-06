"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AccountTree,
  Add,
  BarChart,
  Bookmark,
  Check,
  Dashboard,
  Inventory2,
  Logout,
  ManageSearch,
  Settings,
} from "google-material-icons/outlined";
import { authClient } from "@/lib/auth-client";

type Brand = { id: number; name: string; slug: string };

type IconComponent = React.ComponentType<{
  className?: string;
  color?: string;
  size?: string | number;
}>;

type NavItem = { label: string; href: string; Icon: IconComponent };

const NAV_ITEMS: NavItem[] = [
  { label: "Overview",       href: "/visibility",                Icon: Dashboard    },
  { label: "Products",       href: "/visibility/products",       Icon: Inventory2   },
  { label: "URL Inspection", href: "/visibility/url-inspection", Icon: ManageSearch },
  { label: "Sitemaps",       href: "/visibility/sitemaps",       Icon: AccountTree  },
  { label: "Performance",    href: "/visibility/performance",    Icon: BarChart     },
  { label: "Brand",          href: "/visibility/brand",          Icon: Bookmark     },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Settings", href: "/visibility/settings", Icon: Settings },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [brands, setBrands]       = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [open, setOpen]           = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data: Brand[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setBrands(data);
        const storedId = localStorage.getItem("activeBrandId");
        const stored   = data.find((b) => String(b.id) === storedId);
        setActiveBrand(stored ?? data[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function selectBrand(b: Brand) {
    setActiveBrand(b);
    localStorage.setItem("activeBrandId", String(b.id));
    setOpen(false);
  }

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/visibility" ? pathname === "/visibility" : pathname.startsWith(href);

  const bg = activeBrand
    ? `hsl(${(activeBrand.id * 47) % 360} 60% 90%)`
    : "#d1fae5";
  const fg = activeBrand
    ? `hsl(${(activeBrand.id * 47) % 360} 50% 35%)`
    : "#065f46";

  return (
    <aside className="w-64 shrink-0 bg-[#f0f4fa] flex flex-col overflow-y-auto">
      <div className="px-5 py-5 border-b border-black/5">
        <span className="text-lg font-semibold text-gray-900 tracking-tight">Open D2C</span>
      </div>

      {/* Brand switcher */}
      <div className="px-4 py-3.5 border-b border-black/5 relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: bg }}>
              <span className="text-[9px] font-bold" style={{ color: fg }}>
                {activeBrand ? initials(activeBrand.name) : "?"}
              </span>
            </div>
            <span className="truncate font-medium text-gray-800">
              {activeBrand ? activeBrand.name : "Select brand"}
            </span>
          </div>
          <span className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>

        {open && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl shadow-lg border border-black/5 py-1.5 z-50">
            {brands.map((b) => {
              const bbg = `hsl(${(b.id * 47) % 360} 60% 90%)`;
              const bfg = `hsl(${(b.id * 47) % 360} 50% 35%)`;
              return (
                <button
                  key={b.id}
                  onClick={() => selectBrand(b)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: bbg }}>
                    <span className="text-[9px] font-bold" style={{ color: bfg }}>{initials(b.name)}</span>
                  </div>
                  <span className="flex-1 text-left text-gray-900 font-medium truncate">{b.name}</span>
                  {activeBrand?.id === b.id && (
                    <Check size={16} color="currentColor" className="text-blue-600 shrink-0" />
                  )}
                </button>
              );
            })}

            {brands.length > 0 && <div className="my-1 border-t border-black/5" />}

            <Link
              href="/visibility/brand"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Add size={16} color="currentColor" className="text-gray-400" />
              Add brand
            </Link>

            <div className="my-1 border-t border-black/5" />

            <button
              onClick={signOut}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Logout size={16} color="currentColor" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
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

function SidebarLink({ item, active, compact = false }: { item: NavItem; active: boolean; compact?: boolean }) {
  const Icon = item.Icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-full font-medium transition-colors ${
        compact ? "px-2 py-1 text-base" : "px-4 py-2.5 text-base"
      } ${active ? "bg-[#c2e7ff] text-gray-900" : "text-gray-800 hover:bg-black/5 hover:text-gray-900"}`}
    >
      <Icon size={18} color="currentColor" className={active ? "text-gray-900" : "text-gray-500"} />
      {item.label}
    </Link>
  );
}
