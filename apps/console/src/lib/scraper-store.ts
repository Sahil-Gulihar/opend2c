import { db } from "@/lib/db";

export type SavedSitemap = {
  id: number;
  url: string;
  status: "queued" | "running" | "done" | "failed";
  product_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type SavedProduct = {
  id: number;
  sitemap_id: number;
  source_url: string;
  title: string;
  image: string | null;
  shop: string;
  price: string | null;
  currency: string | null;
  status: "draft" | "active" | "archived";
  notes: string;
  created_at: string;
  updated_at: string;
};

let initialized = false;

export async function ensureScraperTables() {
  if (initialized) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS scraper_sitemaps (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS scraper_products (
      id BIGSERIAL PRIMARY KEY,
      sitemap_id BIGINT NOT NULL REFERENCES scraper_sitemaps(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      image TEXT,
      shop TEXT NOT NULL,
      price TEXT,
      currency TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, source_url)
    );

    CREATE INDEX IF NOT EXISTS idx_scraper_sitemaps_user_id ON scraper_sitemaps(user_id);
    CREATE INDEX IF NOT EXISTS idx_scraper_products_user_id ON scraper_products(user_id);
    CREATE INDEX IF NOT EXISTS idx_scraper_products_sitemap_id ON scraper_products(sitemap_id);
  `);

  initialized = true;
}

export async function listSitemaps(userId: string): Promise<SavedSitemap[]> {
  await ensureScraperTables();
  const { rows } = await db.query<SavedSitemap>(
    `
      SELECT s.id, s.url, s.status, COUNT(p.id)::int AS product_count,
             s.error, s.created_at::text, s.updated_at::text
      FROM scraper_sitemaps s
      LEFT JOIN scraper_products p ON p.sitemap_id = s.id
      WHERE s.user_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `,
    [userId],
  );
  return rows;
}

export async function createSitemap(userId: string, url: string) {
  await ensureScraperTables();
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO scraper_sitemaps (user_id, url, status) VALUES ($1, $2, 'running') RETURNING id`,
    [userId, url],
  );
  return rows[0].id;
}

export async function markSitemapDone(id: number) {
  await db.query(
    `UPDATE scraper_sitemaps SET status='done', error=NULL, updated_at=NOW() WHERE id=$1`,
    [id],
  );
}

export async function markSitemapFailed(id: number, error: string) {
  await db.query(
    `UPDATE scraper_sitemaps SET status='failed', error=$2, updated_at=NOW() WHERE id=$1`,
    [id, error],
  );
}

export async function upsertProducts(
  userId: string,
  sitemapId: number,
  products: Array<{
    source_url: string;
    title: string;
    image: string | null;
    shop: string;
    price: string | null;
    currency: string | null;
  }>,
) {
  for (const product of products) {
    await db.query(
      `
        INSERT INTO scraper_products
          (sitemap_id, user_id, source_url, title, image, shop, price, currency)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id, source_url)
        DO UPDATE SET
          sitemap_id=EXCLUDED.sitemap_id,
          title=EXCLUDED.title,
          image=EXCLUDED.image,
          shop=EXCLUDED.shop,
          price=EXCLUDED.price,
          currency=EXCLUDED.currency,
          updated_at=NOW()
      `,
      [
        sitemapId,
        userId,
        product.source_url,
        product.title,
        product.image,
        product.shop,
        product.price,
        product.currency,
      ],
    );
  }
}

export async function listProducts(userId: string): Promise<SavedProduct[]> {
  await ensureScraperTables();
  const { rows } = await db.query<SavedProduct>(
    `
      SELECT id, sitemap_id, source_url, title, image, shop, price, currency,
             status, notes, created_at::text, updated_at::text
      FROM scraper_products
      WHERE user_id = $1
      ORDER BY updated_at DESC, id DESC
    `,
    [userId],
  );
  return rows;
}

export async function updateProduct(
  userId: string,
  id: number,
  input: Partial<Pick<SavedProduct, "title" | "price" | "currency" | "status" | "notes">>,
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(input)) {
    values.push(value);
    fields.push(`${key} = $${values.length}`);
  }

  if (fields.length === 0) return null;

  values.push(userId, id);
  const { rows } = await db.query<SavedProduct>(
    `
      UPDATE scraper_products
      SET ${fields.join(", ")}, updated_at=NOW()
      WHERE user_id = $${values.length - 1} AND id = $${values.length}
      RETURNING id, sitemap_id, source_url, title, image, shop, price, currency,
                status, notes, created_at::text, updated_at::text
    `,
    values,
  );
  return rows[0] ?? null;
}

