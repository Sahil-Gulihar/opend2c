type ScrapedProduct = {
  source_url: string;
  title: string;
  image: string | null;
  shop: string;
  price: string | null;
  currency: string | null;
};

type Offer = {
  price?: string | number;
  priceCurrency?: string;
  url?: string;
};

const MAX_PRODUCTS_PER_SITEMAP = 80;

export async function scrapeProductsFromSitemap(sitemapUrl: string) {
  const sitemap = await fetchText(sitemapUrl);
  const urls = extractLocs(sitemap)
    .filter((url) => /product|\/p\//i.test(url))
    .slice(0, MAX_PRODUCTS_PER_SITEMAP);

  const products: ScrapedProduct[] = [];

  for (const url of urls) {
    const product = await scrapeProduct(url);
    if (product) products.push(product);
  }

  return products;
}

async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
  try {
    const html = await fetchText(url);
    const raw = findProductJson(html);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const title = typeof parsed.name === "string" ? parsed.name : "";
    if (!title) return null;

    const offer = pickOffer(parsed.offers);
    const sourceUrl = offer?.url ? resolveUrl(url, offer.url) : url;

    return {
      source_url: sourceUrl,
      title,
      image: pickImage(parsed.image),
      shop: new URL(url).hostname.replace(/^www\./, ""),
      price: offer?.price === undefined ? null : String(offer.price),
      currency: offer?.priceCurrency ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; OpenD2CVisibilityBot/1.0; +https://graycup.org)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed with HTTP ${res.status}`);
  }

  return res.text();
}

function extractLocs(xml: string) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    decodeXml(match[1].trim()),
  );
}

function findProductJson(html: string) {
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const script of scripts) {
    const raw = script[1].trim();
    const found = findProductInJson(raw);
    if (found) return JSON.stringify(found);
  }

  return null;
}

function findProductInJson(raw: string): unknown {
  try {
    const parsed = JSON.parse(raw);
    return walkJson(parsed);
  } catch {
    return null;
  }
}

function walkJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walkJson(item);
      if (found) return found;
    }
    return null;
  }

  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;
  const type = obj["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes("Product") || types.includes("ProductGroup")) return obj;

  if (obj["@graph"]) return walkJson(obj["@graph"]);
  return null;
}

function pickOffer(value: unknown): Offer | null {
  if (Array.isArray(value)) return pickOffer(value[0]);
  if (!value || typeof value !== "object") return null;

  const offer = value as Offer & { offers?: unknown };
  if (offer.offers) return pickOffer(offer.offers);
  return offer;
}

function pickImage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return pickImage(value[0]);
  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url;
    return typeof url === "string" ? url : null;
  }
  return null;
}

function resolveUrl(base: string, next: string) {
  try {
    return new URL(next, base).toString();
  } catch {
    return base;
  }
}

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

