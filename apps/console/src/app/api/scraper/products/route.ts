import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { listProducts, updateProduct } from "@/lib/scraper-store";

const STATUSES = new Set(["draft", "active", "archived"]);

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await listProducts(session.user.id);
  return NextResponse.json(products);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = Number(body?.id);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  }

  const input: Record<string, string> = {};

  for (const key of ["title", "price", "currency", "notes"] as const) {
    if (key in body) {
      const value = body[key];
      input[key] = typeof value === "string" ? value.trim() : "";
    }
  }

  if ("status" in body) {
    if (!STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    input.status = body.status;
  }

  const product = await updateProduct(session.user.id, id, input);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json(product);
}
