import { Metadata } from "next";
import { generateTitle, generateDescription } from "@/lib/seo";

export const metadata: Metadata = {
  title: generateTitle("WIP: Government Schemes"),
  description: generateDescription(
    "Still writing.",
  ),
};

export default function Impressum() {
  return (
    <div className="max-w-3xl mx-auto min-h-screen py-3 sm:md-py-5 md:py-10 lg:py-20 ">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">We're Still at it</h1>
    </div>
  );
}
