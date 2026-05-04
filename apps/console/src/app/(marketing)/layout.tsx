import React from "react";
import { Navbar } from "@/components/navbar";

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
