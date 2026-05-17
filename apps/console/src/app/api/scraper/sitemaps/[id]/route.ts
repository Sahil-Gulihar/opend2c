import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import {
  getSitemap,
  deleteSitemap,
  resetSitemapForResync,
  updateSitemapProgress,
  markSitemapDone,
  markSitemapFailed,
  upsertProducts,
} from "@/lib/scraper-store";
import { scrapeProductsFromSitemap } from "@/lib/sitemap-scraper";

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) ? n : null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await resolveId(params);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await deleteSitemap(id, session.user.id);
  return new NextResponse(null, { status: 204 });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await resolveId(params);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const sitemap = await getSitemap(id);
  if (!sitemap || sitemap.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (sitemap.status === "running") {
    return NextResponse.json({ error: "Already running" }, { status: 409 });
  }

  await resetSitemapForResync(id, session.user.id);
  const userId = session.user.id;

  const crawlerWorkerURL = process.env.WORKER_URL?.replace(/\/$/, "");
  const workerSecret = process.env.WORKER_SECRET ?? "";

  if (crawlerWorkerURL && workerSecret) {
    void fetch(`${crawlerWorkerURL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerSecret}`,
      },
      body: JSON.stringify({
        sitemap_url:      sitemap.url,
        sitemap_id:       id,
        console_user_id:  userId,
        batch_size:       50,
        batch_pause_secs: 120,
      }),
    }).catch((err) => {
      console.error("[sitemap resync] go worker handoff failed:", err);
      markSitemapFailed(id, "Worker handoff failed: " + String(err));
    });
  } else {
    void (async () => {
      try {
        await scrapeProductsFromSitemap(sitemap.url, async (batchProducts, scraped, total) => {
          await upsertProducts(userId, id, batchProducts);
          await updateSitemapProgress(id, scraped, total);
        });
        await markSitemapDone(id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to scrape sitemap";
        await markSitemapFailed(id, message);
      }
    })();
  }

  return NextResponse.json({ id });
}
