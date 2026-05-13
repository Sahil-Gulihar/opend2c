import { NextRequest, NextResponse } from "next/server";
import { trackProductClick } from "@/lib/scraper-store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await trackProductClick(productId);
  return NextResponse.json({ ok: true });
}
