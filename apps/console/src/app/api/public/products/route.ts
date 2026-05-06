import { NextRequest, NextResponse } from "next/server";
import { getAllActiveProducts } from "@/lib/scraper-store";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";
  const products = await getAllActiveProducts();

  const results = q
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shop.toLowerCase().includes(q),
      )
    : products;

  return NextResponse.json(results);
}
