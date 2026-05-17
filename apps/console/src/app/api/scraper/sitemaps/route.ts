import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import {
  createSitemap,
  getBrandByUserAndSlug,
  listSitemaps,
  markSitemapDone,
  markSitemapFailed,
  updateSitemapProgress,
  upsertProducts,
} from "@/lib/scraper-store";
import { scrapeProductsFromSitemap } from "@/lib/sitemap-scraper";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandSlug = req.nextUrl.searchParams.get("brandSlug") ?? "";
  const brand = brandSlug ? await getBrandByUserAndSlug(session.user.id, brandSlug) : null;
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const sitemaps = await listSitemaps(session.user.id, brand.id);
  return NextResponse.json(sitemaps);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
  const brandSlug = typeof body?.brandSlug === "string" ? body.brandSlug : "";

  if (!rawUrl) {
    return NextResponse.json({ error: "Sitemap URL is required" }, { status: 400 });
  }

  const brand = brandSlug ? await getBrandByUserAndSlug(session.user.id, brandSlug) : null;
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  let url: string;
  try {
    url = new URL(rawUrl).toString();
  } catch {
    return NextResponse.json({ error: "Enter a valid sitemap URL" }, { status: 400 });
  }

  const sitemapId = await createSitemap(session.user.id, brand.id, url);
  const userId = session.user.id;

  const crawlerWorkerURL = process.env.WORKER_URL?.replace(/\/$/, "");
  const workerSecret = process.env.WORKER_SECRET ?? "";

  if (crawlerWorkerURL && workerSecret) {
    // Delegate to Go worker — it handles batching, rate-limit backoff, and
    // live progress syncing back to this sitemap record
    void fetch(`${crawlerWorkerURL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerSecret}`,
      },
      body: JSON.stringify({
        sitemap_url:     url,
        sitemap_id:      sitemapId,
        console_user_id: userId,
        batch_size:      50,
        batch_pause_secs: 120,
      }),
    }).catch((err) => {
      console.error("[sitemap] go worker handoff failed:", err);
      // If the worker call fails, fall back to marking it failed
      markSitemapFailed(sitemapId, "Worker handoff failed: " + String(err));
    });
  } else {
    // Fallback: TypeScript scraper (no Go worker configured)
    void (async () => {
      try {
        await scrapeProductsFromSitemap(url, async (batchProducts, scraped, total) => {
          await upsertProducts(userId, sitemapId, batchProducts);
          await updateSitemapProgress(sitemapId, scraped, total);
        });
        await markSitemapDone(sitemapId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to scrape sitemap";
        await markSitemapFailed(sitemapId, message);
      }
    })();
  }

  return NextResponse.json({ id: sitemapId }, { status: 202 });
}
