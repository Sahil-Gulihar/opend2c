import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getBrandByUserAndSlug, getClickAnalytics } from "@/lib/scraper-store";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const now = new Date();

  const brandSlug = p.get("brandSlug") ?? "";
  const brand = brandSlug ? await getBrandByUserAndSlug(session.user.id, brandSlug) : null;
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const endDate = p.get("end")
    ? new Date(p.get("end")!)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const startDate = p.get("start")
    ? new Date(p.get("start")!)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const data = await getClickAnalytics(session.user.id, brand.id, startDate, endDate);
  return NextResponse.json(data);
}
