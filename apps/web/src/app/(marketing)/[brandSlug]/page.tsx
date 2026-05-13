import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { withUTM } from "@/lib/utils";

type Brand = {
  id: number;
  slug: string;
  name: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
};

type Product = {
  id: number;
  title: string;
  image: string | null;
  shop: string;
  price: string | null;
  currency: string | null;
  source_url: string;
};

const CONSOLE_URL = (process.env.CONSOLE_URL ?? "http://localhost:3003").replace(/\/$/, "");

async function getBrand(slug: string): Promise<Brand | null> {
  try {
    const res = await fetch(`${CONSOLE_URL}/api/public/brands/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getProducts(slug: string): Promise<Product[]> {
  try {
    const res = await fetch(`${CONSOLE_URL}/api/public/brands/${slug}/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await getBrand(brandSlug);
  if (!brand) return {};
  return {
    title: brand.name,
    description: brand.description || `Browse products from ${brand.name}`,
  };
}

export default async function BrandProfilePage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;
  const [brand, products] = await Promise.all([getBrand(brandSlug), getProducts(brandSlug)]);

  if (!brand) notFound();

  const featured = products.slice(0, 6);

  return (
    <div className="px-4 py-12 max-w-5xl mx-auto">
      {/* Brand header */}
      <div className="flex items-start gap-5 mb-10">
        {brand.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="h-16 w-16 rounded-xl object-cover bg-gray-100 shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-emerald-700">
              {brand.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{brand.name}</h1>
          {brand.description && (
            <p className="mt-1.5 text-sm text-gray-500 max-w-xl">{brand.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            {brand.website_url && (
              <a
                href={brand.website_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                {brand.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
            <Link
              href={`/${brandSlug}/products`}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2"
            >
              View all products →
            </Link>
          </div>
        </div>
      </div>

      {/* Featured products */}
      {featured.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Products</h2>
            {products.length > 6 && (
              <Link
                href={`/${brandSlug}/products`}
                className="text-xs text-blue-600 hover:underline"
              >
                See all {products.length} →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {featured.map((product) => (
              <a
                key={product.id}
                href={withUTM(product.source_url)}
                target="_blank"
                rel="noreferrer"
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100" />
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {product.title}
                  </p>
                  {product.price && (
                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {product.currency ? `${product.currency} ` : ""}
                      {product.price}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">No products listed yet.</p>
        </div>
      )}
    </div>
  );
}
