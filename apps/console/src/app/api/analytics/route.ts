import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getClickAnalytics } from "@/lib/scraper-store";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const now = new Date();

  const endDate = p.get("end")
    ? new Date(p.get("end")!)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // tomorrow midnight UTC

  const startDate = p.get("start")
    ? new Date(p.get("start")!)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days back

  const data = await getClickAnalytics(startDate, endDate);
  return NextResponse.json(data);
}
