import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden">
      {/* Header */}
      <Navbar />

      {/* Main content */}
      <main className="w-full">
        <div className="max-w-7xl mx-auto  ">{children}</div>
      </main>
    </div>
  );
}
