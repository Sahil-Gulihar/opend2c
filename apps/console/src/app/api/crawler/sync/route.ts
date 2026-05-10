import { NextRequest, NextResponse } from "next/server";
import { syncCrawlerProducts } from "@/lib/scraper-store";

// Called by the crawler worker when a job completes.
// Authenticated with the same WORKER_SECRET used by all crawler routes.
export async function POST(req: NextRequest) {
  const secret = process.env.WORKER_SECRET ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.jobId || !Array.isArray(body?.products)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { jobId, products } = body as {
    jobId: string;
    products: Array<{
      source_url: string;
      title: string;
      image: string | null;
      shop: string;
      price: string | null;
      currency: string | null;
    }>;
  };

  await syncCrawlerProducts(jobId, products);

  return NextResponse.json({ synced: products.length });
}
