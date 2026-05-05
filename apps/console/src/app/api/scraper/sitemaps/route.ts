import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import {
  createSitemap,
  listSitemaps,
  markSitemapDone,
  markSitemapFailed,
  updateSitemapProgress,
  upsertProducts,
} from "@/lib/scraper-store";
import { scrapeProductsFromSitemap } from "@/lib/sitemap-scraper";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sitemaps = await listSitemaps(session.user.id);
  return NextResponse.json(sitemaps);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

  if (!rawUrl) {
    return NextResponse.json({ error: "Sitemap URL is required" }, { status: 400 });
  }

  let url: string;
  try {
    url = new URL(rawUrl).toString();
  } catch {
    return NextResponse.json({ error: "Enter a valid sitemap URL" }, { status: 400 });
  }

  const sitemapId = await createSitemap(session.user.id, url);
  const userId = session.user.id;

  // Fire-and-forget — scrape in background so SSE can stream progress
  void (async () => {
    try {
      const products = await scrapeProductsFromSitemap(url, async (scraped, total) => {
        await updateSitemapProgress(sitemapId, scraped, total);
      });
      await upsertProducts(userId, sitemapId, products);
      await markSitemapDone(sitemapId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to scrape sitemap";
      await markSitemapFailed(sitemapId, message);
    }
  })();

  return NextResponse.json({ id: sitemapId }, { status: 202 });
}
