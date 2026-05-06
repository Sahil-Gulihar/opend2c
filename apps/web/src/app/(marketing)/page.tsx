"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Script from "next/script";
import { CoffeeCup } from "@/components/svgs";
import Image from "next/image";
import { Search } from "lucide-react";

const CATEGORIES = ["All", "Tea", "Coffee", "Spices"] as const;
type Category = (typeof CATEGORIES)[number];

const products = [
  {
    name: "Darjeeling First Flush",
    category: "Tea",
    origin: "Darjeeling, West Bengal",
    seller: "Darjeeling Fine Teas",
    sellerProfile: "/sellers/darjeeling-fine-teas",
    price: "₹450/kg",
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=200&fit=crop",
  },
  {
    name: "Coorg Arabica Single Origin",
    category: "Coffee",
    origin: "Madikeri, Karnataka",
    seller: "Coorg Coffee Works",
    sellerProfile: "/sellers/coorg-coffee-works",
    price: "₹380/kg",
    rating: 4.6,
    reviewCount: 89,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=200&fit=crop",
  },
  {
    name: "Nilgiri Orthodox Green",
    category: "Tea",
    origin: "Ooty, Tamil Nadu",
    seller: "Nilgiri Tea Exports",
    sellerProfile: "/sellers/nilgiri-tea-exports",
    price: "₹320/kg",
    rating: 4.5,
    reviewCount: 67,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=200&fit=crop",
  },
  {
    name: "Robusta Cherry",
    category: "Coffee",
    origin: "Wayanad, Kerala",
    seller: "Wayanad Spice & Coffee",
    sellerProfile: "/sellers/wayanad-spice-coffee",
    price: "₹180/kg",
    rating: 3.9,
    reviewCount: 42,
    verified: false,
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=200&fit=crop",
  },
  {
    name: "Assam CTC BOP",
    category: "Tea",
    origin: "Guwahati, Assam",
    seller: "Assam Bulk Traders",
    sellerProfile: "/sellers/assam-bulk-traders",
    price: "₹120/kg",
    rating: 4.1,
    reviewCount: 203,
    verified: false,
    image:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=200&fit=crop",
  },
  {
    name: "Wayanad Black Pepper",
    category: "Spices",
    origin: "Wayanad, Kerala",
    seller: "Wayanad Spice & Coffee",
    sellerProfile: "/sellers/wayanad-spice-coffee",
    price: "₹650/kg",
    rating: 4.7,
    reviewCount: 58,
    verified: false,
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=200&fit=crop",
  },
  {
    name: "Darjeeling Second Flush Oolong",
    category: "Tea",
    origin: "Darjeeling, West Bengal",
    seller: "Darjeeling Fine Teas",
    sellerProfile: "/sellers/darjeeling-fine-teas",
    price: "₹890/kg",
    rating: 4.9,
    reviewCount: 76,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=200&fit=crop",
  },
  {
    name: "Chikmagalur Peaberry",
    category: "Coffee",
    origin: "Chikmagalur, Karnataka",
    seller: "Chikmagalur Origins",
    sellerProfile: "/sellers/chikmagalur-origins",
    price: "₹520/kg",
    rating: 4.7,
    reviewCount: 91,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop",
  },
  {
    name: "Munnar White Tea",
    category: "Tea",
    origin: "Munnar, Kerala",
    seller: "Munnar Estate Brokers",
    sellerProfile: "/sellers/munnar-estate-brokers",
    price: "₹1,200/kg",
    rating: 4.8,
    reviewCount: 35,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&h=200&fit=crop",
  },
];

const whatWeDoItems = [
  {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    path: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
    title: "Sourcing",
    description:
      "Partnering directly with farms and estates to source traceable, high-quality tea and coffee beans.",
  },
  {
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-700",
    path: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    title: "Retail",
    description:
      "Bringing exceptional beans directly to consumers and businesses who value origin and craft.",
  },
  {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    path: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
    title: "Tech Solutions",
    description:
      "Management tools, D2C infrastructure, and digital operations built for the tea and coffee supply chain.",
  },
];

const techCards = [
  {
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    path: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Yield & Harvest Analytics",
    description:
      "Track harvest volumes, predict yields by lot, and monitor per-hectare output across seasons.",
  },
  {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    path: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
    title: "Origin & Traceability",
    description:
      "Lot-level records tied to farm location, processing method, and export documentation.",
  },
  {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    path: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Quality Control & Grading",
    description:
      "Log cupping scores, defect rates, and moisture readings per batch across stations.",
  },
  {
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
    path: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    title: "Inventory & Stock Management",
    description:
      "Real-time visibility from cherry to export-ready bags across your warehouse.",
  },
  {
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
    path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    title: "Export & Compliance Docs",
    description:
      "Phytosanitary certs, ICO forms, and buyer contracts — organized and audit-ready.",
  },
  {
    iconBg: "bg-teal-100",
    iconColor: "text-teal-700",
    path: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "Worker & Labour Tracking",
    description:
      "Picker counts, wages, and payroll simplified for seasonal labour across estates.",
  },
  {
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-700",
    path: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01",
    title: "Infrastructure & DevOps",
    description:
      "Scalable cloud infrastructure, CI/CD pipelines, and automated deployments that grow with your brand.",
  },
  {
    iconBg: "bg-red-100",
    iconColor: "text-red-700",
    path: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    title: "Security & Compliance",
    description:
      "End-to-end security solutions, PCI compliance, and data protection for customer trust.",
  },
  {
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-700",
    path: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Analytics & Insights",
    description:
      "Customer behavior analytics, conversion tracking, and business intelligence dashboards.",
  },
  {
    iconBg: "bg-pink-100",
    iconColor: "text-pink-700",
    path: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    title: "E-commerce Optimization",
    description:
      "Performance optimization, payment integrations, and checkout experience enhancements.",
  },
  {
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    path: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "Customer Experience",
    description:
      "Personalization engines, support systems, and loyalty program integrations.",
  },
  {
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
    path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    title: "Operations & Automation",
    description:
      "Inventory management, order fulfillment, and supply chain automation solutions.",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");

  const filtered = products.filter((p) => {
    const matchesCategory = category === "All" || p.category === category;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q) ||
      p.seller.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div>
      <Script
        id="org-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Open D2C",
            url: "https://graycup.org",
            description: "Global exporter of coffee, tea and spices.",
          }),
        }}
      />
      <div className="mx-auto px-4 lg:px-6 h-auto my-10">
        <div className="md:min-h-screen pt-10 pb-20 max-w-6xl mx-auto md:pb-0 flex flex-col justify-center">
          <div className="grid grid-cols-1 md:grid-cols-[70%_30%] gap-6 items-center">
            {/* Left Column */}
            <div>
              <div>
                <h1 className="relative text-black text-3xl sm:text-4xl lg:text-5xl font-medium sm:leading-[60px] ">
                  Tea, Coffee,
                  <br />
                  and <span>Liquid</span>.
                  <br />
                  Poured into Humans.
                </h1>
              </div>

             <div className="flex relative mt-10 flex-col max:smml-4 ">
                {/*  <div className="flex flex-row gap-4">
                  <a href="/contact" target="_blank">
                    <Button variant="redoutline" size="sm" className="">
                      Become a Seller
                    </Button>
                  </a>
                  <a href="/shop">
                    <Button variant="gray" size="sm">
                      Become a Buyer
                    </Button>
                  </a>
                </div> */}

                {/* Search */}
                <div className="mt-8 w-full max-w-xl">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search tea, coffee, spices by name or origin..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 shadow-sm"
                    />
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          category === c
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product cards */}
          <div className="mt-10 mb-4">
            <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium mb-4">
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </p>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filtered.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-xl bg-white hover:shadow-sm transition-all flex flex-col"
                  >
                    {/* Image — padded so all corners are visible */}
                    <div className="p-3 pb-0">
                      <div className="relative h-52 w-full bg-neutral-100 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                        {p.name}
                      </h3>

                      {/* Company name with verified check */}
                      <div className="flex items-center gap-1 mb-1">
                        {p.verified && (
                          <svg
                            className="h-3.5 w-3.5 text-blue-500 shrink-0"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <p className="text-xs text-neutral-500">{p.seller}</p>
                      </div>

                      <span className="text-sm font-semibold text-neutral-900 mb-3">
                        {p.price}
                      </span>

                      {/* Star reviews */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-3.5 w-3.5 ${star <= Math.round(p.rating) ? "text-amber-400" : "text-neutral-200"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-neutral-400">
                          {p.rating.toFixed(1)} ({p.reviewCount})
                        </span>
                      </div>

                      <a
                        href={p.sellerProfile}
                        className="mt-auto self-start rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        Get in touch
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 py-10 text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>

          <div className="my-20 py-20 bg-neutral-100">
            <h2 className="text-5xl font-medium text-neutral-900 mb-6 flex justify-center flex-row items-center gap-4 font-instrument-sans"></h2>
          </div>

          {/* <Image src="/beans-circle.webp" alt="coffee beans" className="pl-2" width={200} height={200} /> */}
        </div>
      </div>
      <div className="px-4 lg:px-6"></div>
      {/* <CoffeeSection /> */}
    </div>
  );
}
