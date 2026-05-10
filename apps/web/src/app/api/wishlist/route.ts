import { NextRequest, NextResponse } from "next/server";
import { customerAuth } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { wishlist } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

async function getSession() {
  return customerAuth.api.getSession({ headers: await headers() });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await db
    .select()
    .from(wishlist)
    .where(eq(wishlist.userId, session.user.id))
    .orderBy(wishlist.createdAt);

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { productId, sourceUrl, title, image, shop, price, currency } = body;

  if (!productId || !sourceUrl || !title || !shop) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const [item] = await db
    .insert(wishlist)
    .values({
      userId: session.user.id,
      productId,
      sourceUrl,
      title,
      image: image ?? null,
      shop,
      price: price ?? null,
      currency: currency ?? null,
    })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = Number(searchParams.get("productId"));
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await db
    .delete(wishlist)
    .where(and(eq(wishlist.userId, session.user.id), eq(wishlist.productId, productId)));

  return new NextResponse(null, { status: 204 });
}
