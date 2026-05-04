"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header className="w-full border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          {/* LEFT */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-xl font-semibold text-nowrap tracking-tight">
                Open D2C
              </span>
            </Link>
            <p className="opacity-20">|</p>

            {/* Tablet-visible links */}
            <nav className="hidden md:flex gap-1 text-sm font-medium">
              {[
                ["Pricing", "/pricing"],
                ["Tech Solutions", "/solutions"],
                ["About", "/about"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md px-2 py-2 hover:bg-neutral-100"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Desktop-only links */}
            <p className="opacity-20 hidden lg:block">|</p>
            <nav className="hidden lg:flex text-sm font-medium">
              {[["Careers", "/careers"]].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md px-2 py-2 hover:bg-neutral-100"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <a
              id="store-link"
              href="/login"
              rel="noopener"
              className="hidden lg:inline-block"
            >
              <Button variant="blue" size="sm">
                Login
              </Button>
            </a>
            <a
              id="store-link"
              href="/marketplace"
              target="_blank"
              rel="noopener"
              className="hidden lg:inline-block"
            >
              <Button variant="gray" size="sm">
                Visit Marketplace
              </Button>
            </a>

            {/* Hamburger — visible whenever anything is hidden */}
            <button
              className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-neutral-100"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ================= SIDEBAR ================= */}
      <div
        className={`fixed inset-0 z-50 transition-opacity ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer */}
        <aside
          className={`absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-xl
          transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${menuOpen ? "translate-x-0" : "translate-x-full"}
        `}
        >
          <button
            className="mb-4 self-end rounded-md cursor-pointer p-2 hover:bg-neutral-100"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>

          {/* All links */}
          <nav className="flex flex-col gap-2 text-sm font-medium">
            {[
              ["Pricing", "/pricing"],
              ["Newsroom", "/newsroom"],
              ["Social Responsibility", "/social-responsibility"],
              ["Careers", "/careers"],
              ["About", "/about"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 hover:bg-neutral-100"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="mt-auto flex flex-col gap-2 pt-6">

          </div>
        </aside>
      </div>
    </>
  );
}
