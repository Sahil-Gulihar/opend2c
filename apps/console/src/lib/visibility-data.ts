export type ProductStatus = "indexed" | "not_indexed" | "error";

export type Product = {
  id: string;
  title: string;
  url: string;
  status: ProductStatus;
  lastCrawled: string;
  visibilityScore: number;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  issues: string[];
  category: string;
  price: string;
};

export type PerformancePoint = {
  date: string;
  impressions: number;
  clicks: number;
};

export type Query = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type Sitemap = {
  url: string;
  status: "success" | "error" | "pending";
  lastRead: string;
  discoveredUrls: number;
  indexedUrls: number;
};

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Darjeeling First Flush Whole Leaf Tea",
    url: "/products/darjeeling-first-flush",
    status: "indexed",
    lastCrawled: "2026-05-03",
    visibilityScore: 92,
    clicks: 1204,
    impressions: 18400,
    ctr: 6.5,
    position: 3.2,
    issues: [],
    category: "Tea",
    price: "₹840",
  },
  {
    id: "p2",
    title: "Assam CTC Breakfast Blend",
    url: "/products/assam-ctc-breakfast",
    status: "indexed",
    lastCrawled: "2026-05-03",
    visibilityScore: 87,
    clicks: 980,
    impressions: 15600,
    ctr: 6.3,
    position: 4.1,
    issues: [],
    category: "Tea",
    price: "₹320",
  },
  {
    id: "p3",
    title: "Nilgiri High-Altitude Green Tea",
    url: "/products/nilgiri-green-tea",
    status: "indexed",
    lastCrawled: "2026-05-02",
    visibilityScore: 74,
    clicks: 612,
    impressions: 11200,
    ctr: 5.5,
    position: 6.8,
    issues: ["Missing meta description"],
    category: "Tea",
    price: "₹560",
  },
  {
    id: "p4",
    title: "Coorg Single-Origin Arabica Coffee",
    url: "/products/coorg-arabica-coffee",
    status: "indexed",
    lastCrawled: "2026-05-01",
    visibilityScore: 81,
    clicks: 744,
    impressions: 9800,
    ctr: 7.6,
    position: 5.3,
    issues: [],
    category: "Coffee",
    price: "₹680",
  },
  {
    id: "p5",
    title: "Chikmagalur Estate Robusta Ground Coffee",
    url: "/products/chikmagalur-robusta",
    status: "not_indexed",
    lastCrawled: "2026-04-28",
    visibilityScore: 0,
    clicks: 0,
    impressions: 210,
    ctr: 0,
    position: 0,
    issues: ["Blocked by robots.txt", "noindex tag present"],
    category: "Coffee",
    price: "₹490",
  },
  {
    id: "p6",
    title: "Ceremonial Grade Matcha Powder",
    url: "/products/ceremonial-matcha",
    status: "indexed",
    lastCrawled: "2026-05-03",
    visibilityScore: 88,
    clicks: 892,
    impressions: 13400,
    ctr: 6.7,
    position: 4.6,
    issues: [],
    category: "Matcha",
    price: "₹1,200",
  },
  {
    id: "p7",
    title: "Culinary Matcha — Barista Grade",
    url: "/products/culinary-matcha-barista",
    status: "error",
    lastCrawled: "2026-04-25",
    visibilityScore: 12,
    clicks: 18,
    impressions: 760,
    ctr: 2.4,
    position: 18.2,
    issues: ["Server error (5xx) on last crawl", "Duplicate title tag"],
    category: "Matcha",
    price: "₹720",
  },
  {
    id: "p8",
    title: "Sikkim Temi Estate Organic Black Tea",
    url: "/products/sikkim-temi-organic",
    status: "indexed",
    lastCrawled: "2026-05-02",
    visibilityScore: 79,
    clicks: 534,
    impressions: 8900,
    ctr: 6.0,
    position: 7.4,
    issues: ["Slow page load (4.2s)"],
    category: "Tea",
    price: "₹960",
  },
  {
    id: "p9",
    title: "Kangra Valley White Peony Tea",
    url: "/products/kangra-white-peony",
    status: "not_indexed",
    lastCrawled: "2026-04-20",
    visibilityScore: 0,
    clicks: 0,
    impressions: 140,
    ctr: 0,
    position: 0,
    issues: ["Page not found (404)", "No canonical tag"],
    category: "Tea",
    price: "₹1,080",
  },
  {
    id: "p10",
    title: "Cold Brew Coffee Concentrate",
    url: "/products/cold-brew-concentrate",
    status: "indexed",
    lastCrawled: "2026-05-03",
    visibilityScore: 83,
    clicks: 688,
    impressions: 10200,
    ctr: 6.7,
    position: 5.9,
    issues: [],
    category: "Coffee",
    price: "₹580",
  },
  {
    id: "p11",
    title: "Darjeeling Second Flush Muscatel",
    url: "/products/darjeeling-muscatel",
    status: "indexed",
    lastCrawled: "2026-05-01",
    visibilityScore: 90,
    clicks: 1056,
    impressions: 16100,
    ctr: 6.6,
    position: 3.8,
    issues: [],
    category: "Tea",
    price: "₹1,040",
  },
  {
    id: "p12",
    title: "Instant Matcha Latte Mix",
    url: "/products/instant-matcha-latte",
    status: "error",
    lastCrawled: "2026-04-22",
    visibilityScore: 8,
    clicks: 6,
    impressions: 420,
    ctr: 1.4,
    position: 22.1,
    issues: ["Redirect loop detected", "Missing structured data"],
    category: "Matcha",
    price: "₹440",
  },
];

export const PERFORMANCE_DATA: PerformancePoint[] = [
  { date: "Apr 7", impressions: 82400, clicks: 4820 },
  { date: "Apr 8", impressions: 86100, clicks: 5140 },
  { date: "Apr 9", impressions: 79800, clicks: 4690 },
  { date: "Apr 10", impressions: 91200, clicks: 5480 },
  { date: "Apr 11", impressions: 94600, clicks: 5820 },
  { date: "Apr 12", impressions: 88300, clicks: 5260 },
  { date: "Apr 13", impressions: 72100, clicks: 4180 },
  { date: "Apr 14", impressions: 76400, clicks: 4410 },
  { date: "Apr 15", impressions: 98200, clicks: 6040 },
  { date: "Apr 16", impressions: 102100, clicks: 6380 },
  { date: "Apr 17", impressions: 99400, clicks: 6120 },
  { date: "Apr 18", impressions: 107800, clicks: 6740 },
  { date: "Apr 19", impressions: 112300, clicks: 7020 },
  { date: "Apr 20", impressions: 104600, clicks: 6560 },
  { date: "Apr 21", impressions: 88100, clicks: 5340 },
  { date: "Apr 22", impressions: 92400, clicks: 5680 },
  { date: "Apr 23", impressions: 108600, clicks: 6820 },
  { date: "Apr 24", impressions: 115200, clicks: 7140 },
  { date: "Apr 25", impressions: 118900, clicks: 7380 },
  { date: "Apr 26", impressions: 121400, clicks: 7620 },
  { date: "Apr 27", impressions: 116800, clicks: 7280 },
  { date: "Apr 28", impressions: 96200, clicks: 5940 },
  { date: "Apr 29", impressions: 101400, clicks: 6360 },
  { date: "Apr 30", impressions: 119600, clicks: 7480 },
  { date: "May 1", impressions: 124800, clicks: 7820 },
  { date: "May 2", impressions: 128400, clicks: 8060 },
  { date: "May 3", impressions: 131200, clicks: 8240 },
  { date: "May 4", impressions: 127600, clicks: 7980 },
];

export const TOP_QUERIES: Query[] = [
  { query: "darjeeling first flush tea", clicks: 1204, impressions: 18400, ctr: 6.5, position: 3.2 },
  { query: "buy assam tea online", clicks: 980, impressions: 15600, ctr: 6.3, position: 4.1 },
  { query: "ceremonial matcha india", clicks: 892, impressions: 13400, ctr: 6.7, position: 4.6 },
  { query: "darjeeling muscatel 2026", clicks: 1056, impressions: 16100, ctr: 6.6, position: 3.8 },
  { query: "nilgiri green tea buy", clicks: 612, impressions: 11200, ctr: 5.5, position: 6.8 },
  { query: "coorg arabica coffee beans", clicks: 744, impressions: 9800, ctr: 7.6, position: 5.3 },
  { query: "cold brew coffee concentrate india", clicks: 688, impressions: 10200, ctr: 6.7, position: 5.9 },
  { query: "organic black tea sikkim", clicks: 534, impressions: 8900, ctr: 6.0, position: 7.4 },
  { query: "single origin coffee india", clicks: 398, impressions: 7200, ctr: 5.5, position: 8.1 },
  { query: "white peony tea kangra", clicks: 212, impressions: 4800, ctr: 4.4, position: 11.2 },
];

export const SITEMAPS: Sitemap[] = [
  {
    url: "https://store.example.com/sitemap.xml",
    status: "success",
    lastRead: "2026-05-04",
    discoveredUrls: 156,
    indexedUrls: 142,
  },
  {
    url: "https://store.example.com/sitemap-products.xml",
    status: "success",
    lastRead: "2026-05-03",
    discoveredUrls: 84,
    indexedUrls: 76,
  },
  {
    url: "https://store.example.com/sitemap-collections.xml",
    status: "error",
    lastRead: "2026-04-29",
    discoveredUrls: 0,
    indexedUrls: 0,
  },
  {
    url: "https://store.example.com/sitemap-blog.xml",
    status: "success",
    lastRead: "2026-05-02",
    discoveredUrls: 38,
    indexedUrls: 36,
  },
];

export const OVERVIEW_METRICS = {
  impressions: { value: "2.84M", change: "+12.4%", up: true },
  clicks: { value: "174.2K", change: "+9.8%", up: true },
  indexedProducts: { value: "9 / 12", change: "75%", up: null },
  ctr: { value: "6.1%", change: "+0.3pp", up: true },
  avgPosition: { value: "5.4", change: "-0.8", up: true },
};
