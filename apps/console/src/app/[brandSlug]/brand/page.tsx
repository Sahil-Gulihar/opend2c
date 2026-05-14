"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const BRAND_CATEGORIES = [
  "Skincare",
  "Haircare",
  "Makeup",
  "Bath & Body",
  "Personal Care",
  "Fragrances",
  "Men's Grooming",
  "Supplements",
  "Coffee",
  "Tea",
  "Health Drinks",
  "Beverages",
  "Snacks",
  "Food",
  "Organic Food",
  "Masala & Spices",
  "Dry Fruits",
  "Protein Foods",
  "Clothing",
  "Streetwear",
  "Ethnic Wear",
  "Activewear",
  "Innerwear",
  "Footwear",
  "Shoes",
  "Bags",
  "Accessories",
  "Jewellery",
  "Watches",
  "Home & Living",
  "Home Decor",
  "Furniture",
  "Kitchenware",
  "Bedding",
  "Consumer Electronics",
  "Audio",
  "Smart Gadgets",
  "Gaming",
  "Pet Care",
  "Baby Care",
  "Stationery",
  "Travel",
  "Outdoor",
  "Luxury",
  "Handmade",
  "Artisan",
] as const;

type Brand = {
  id: number;
  slug: string;
  name: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  website_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  categories: string[];
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CategoryDropdown({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(cat: string) {
    onChange(value.includes(cat) ? value.filter((c) => c !== cat) : [...value, cat]);
  }

  const label =
    value.length === 0
      ? "Select categories…"
      : value.length === 1
      ? value[0]
      : `${value[0]} +${value.length - 1} more`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-left focus:outline-none focus:ring-1 focus:ring-gray-400 hover:bg-gray-50 transition-colors"
      >
        <span className={value.length === 0 ? "text-gray-400" : "text-gray-800"}>
          {label}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto py-1">
            {BRAND_CATEGORIES.map((cat) => {
              const checked = value.includes(cat);
              return (
                <label
                  key={cat}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(cat)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-0"
                  />
                  <span className={checked ? "text-gray-900 font-medium" : "text-gray-600"}>
                    {cat}
                  </span>
                </label>
              );
            })}
          </div>
          {value.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">{value.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BrandForm({ brand, onSaved }: { brand: Brand; onSaved: (b: Brand) => void }) {
  const [name, setName]              = useState(brand.name);
  const [slug, setSlug]              = useState(brand.slug);
  const [description, setDesc]       = useState(brand.description);
  const [logoUrl, setLogo]           = useState(brand.logo_url ?? "");
  const [bannerUrl, setBanner]       = useState(brand.banner_url ?? "");
  const [websiteUrl, setWebsite]     = useState(brand.website_url ?? "");
  const [twitterUrl, setTwitter]     = useState(brand.twitter_url ?? "");
  const [instagramUrl, setInstagram] = useState(brand.instagram_url ?? "");
  const [categories, setCategories]  = useState<string[]>(brand.categories ?? []);
  const [slugEdited, setSlugEdited]  = useState(true);
  const [saving, setSaving]          = useState(false);
  const [error, setError]            = useState("");

  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/brands/${brand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        logo_url: logoUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        categories,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not save");
      return;
    }
    const saved: Brand = await res.json();
    onSaved(saved);
    if (saved.slug !== brand.slug) {
      router.replace(`/${saved.slug}/brand`);
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white";

  return (
    <form onSubmit={save}>
      {/* Profile section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Profile</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Brand name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              URL slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugEdited(true); }}
              className={`${inputCls} font-mono`}
            />
            <p className="mt-1 text-xs text-gray-400">opend2c.com/{slug || "your-brand"}</p>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Tell customers about your brand…"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Categories</label>
            <CategoryDropdown value={categories} onChange={setCategories} />
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <span key={cat} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visuals + Links side-by-side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visuals</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://…/logo.png"
              className={inputCls}
            />
            {logoUrl && (
              <img
                src={logoUrl}
                alt=""
                className="mt-2 h-12 w-12 rounded-lg object-contain border border-gray-100 bg-gray-50"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Banner URL</label>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="https://…/banner.jpg"
              className={inputCls}
            />
            {bannerUrl && (
              <img
                src={bannerUrl}
                alt=""
                className="mt-2 w-full h-24 rounded-lg object-cover border border-gray-100 bg-gray-50"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Links</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Website</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourstore.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Twitter / X</label>
            <input
              type="text"
              value={twitterUrl}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://twitter.com/yourbrand"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Instagram</label>
            <input
              type="text"
              value={instagramUrl}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourbrand"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function TransferForm({ brand, onTransferred }: { brand: Brand; onTransferred: () => void }) {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm(`Transfer "${brand.name}" to ${email}? You will lose ownership.`)) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/brands/${brand.id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Transfer failed");
      return;
    }
    setDone(true);
    onTransferred();
  }

  if (done) return <p className="text-xs text-emerald-600 font-medium">Transferred successfully.</p>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-gray-500">
          Transfer ownership to another registered account. You will immediately lose access to this brand.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="their@email.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
          >
            {loading ? "Transferring…" : "Transfer"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </div>
  );
}

export default function BrandEditPage() {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const router = useRouter();
  const [brand, setBrand]     = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"edit" | "transfer">("edit");

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((brands: Brand[]) => {
        const found = brands.find((b) => b.slug === brandSlug);
        if (!found) { setNotFound(true); } else { setBrand(found); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [brandSlug]);

  if (loading) {
    return <div className="px-8 py-10 text-sm text-gray-400">Loading…</div>;
  }

  if (notFound || !brand) {
    return (
      <div className="px-8 py-10 text-center">
        <p className="text-sm text-gray-400">Brand not found.</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">{brand.name}</h1>
        <p className="text-xs text-gray-400 font-mono mt-0.5">opend2c.com/{brand.slug}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100 mb-6">
        {(["edit", "transfer"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2.5 text-xs font-medium capitalize border-b-2 transition-colors -mb-px ${
              tab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "transfer" ? "Transfer ownership" : "Edit profile"}
          </button>
        ))}
      </div>

      {tab === "edit" ? (
        <BrandForm key={brand.id} brand={brand} onSaved={setBrand} />
      ) : (
        <TransferForm brand={brand} onTransferred={() => router.push("/")} />
      )}
    </div>
  );
}
