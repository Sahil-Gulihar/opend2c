import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getBrandByUserAndSlug, getProductIssuesSummary } from "@/lib/scraper-store";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandSlug = req.nextUrl.searchParams.get("brandSlug") ?? "";
  const brand = brandSlug ? await getBrandByUserAndSlug(session.user.id, brandSlug) : null;
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const data = await getProductIssuesSummary(session.user.id, brand.id);
  return NextResponse.json(data);
}
