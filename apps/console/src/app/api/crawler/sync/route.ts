import { NextRequest, NextResponse } from "next/server";
import { upsertProducts } from "@/lib/scraper-store";

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

  const { jobId, userId, products } = body as {
    jobId: string;
    userId: string;
    products: Array<{
      source_url: string;
      title: string;
      image: string | null;
      shop: string;
      price: string | null;
      currency: string | null;
    }>;
  };

  // userId is optional — fall back to a system sentinel so products are still
  // visible publicly even if no console user owns this job.
  const owner = userId ?? `crawler:${jobId}`;

  await upsertProducts(owner, 0, products);

  return NextResponse.json({ synced: products.length });
}
