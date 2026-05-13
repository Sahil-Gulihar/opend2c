import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const consoleUrl = (process.env.CONSOLE_URL ?? "http://localhost:3003").replace(/\/$/, "");
  try {
    await fetch(`${consoleUrl}/api/public/products/${id}/click`, { method: "POST" });
  } catch {
    // fire-and-forget — don't fail the response if tracking fails
  }

  return NextResponse.json({ ok: true });
}
