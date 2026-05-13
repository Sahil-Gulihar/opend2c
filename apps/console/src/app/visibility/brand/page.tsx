"use client";

import { useEffect, useState } from "react";

type Brand = {
  id: number;
  slug: string;
  name: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function BrandForm({
  brand,
  onSaved,
  onCancel,
}: {
  brand?: Brand;
  onSaved: (b: Brand) => void;
  onCancel?: () => void;
}) {
  const [name, setName]           = useState(brand?.name ?? "");
  const [slug, setSlug]           = useState(brand?.slug ?? "");
  const [description, setDesc]    = useState(brand?.description ?? "");
  const [websiteUrl, setWebsite]  = useState(brand?.website_url ?? "");
  const [slugEdited, setSlugEdited] = useState(!!brand);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  function onNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { name: name.trim(), slug: slug.trim(), description: description.trim(), website_url: websiteUrl.trim() || null };
    const res = brand
      ? await fetch(`/api/brands/${brand.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? "Could not save"); return; }
    onSaved(await res.json());
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Brand name <span className="text-red-500">*</span></label>
        <input type="text" required value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="My Store"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">URL slug <span className="text-red-500">*</span></label>
        <input type="text" required value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugEdited(true); }}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono" />
        <p className="mt-1 text-xs text-gray-400">opend2c.com/{slug || "your-brand"}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Website</label>
        <input type="text" value={websiteUrl} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourstore.com"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
        <textarea rows={3} value={description} onChange={(e) => setDesc(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        )}
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50">
          {saving ? "Saving…" : brand ? "Update" : "Create brand"}
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
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? "Transfer failed"); return; }
    setDone(true);
    onTransferred();
  }

  if (done) return <p className="text-xs text-emerald-600 font-medium">Transferred successfully.</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-gray-500">Transfer ownership to another registered account. You will immediately lose access to this brand.</p>
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="their@email.com"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400" />
        <button type="submit" disabled={loading}
          className="px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50">
          {loading ? "Transferring…" : "Transfer"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}

export default function BrandPage() {
  const [brands, setBrands]     = useState<Brand[]>([]);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab]           = useState<"edit" | "transfer">("edit");

  async function load() {
    const res = await fetch("/api/brands");
    if (res.ok) { const data: Brand[] = await res.json(); setBrands(data); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(brand: Brand) {
    if (!window.confirm(`Delete "${brand.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
    setDeleting(false);
    if (selected?.id === brand.id) setSelected(null);
    setBrands((prev) => prev.filter((b) => b.id !== brand.id));
  }

  function handleSaved(saved: Brand) {
    setBrands((prev) => {
      const exists = prev.find((b) => b.id === saved.id);
      return exists ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved];
    });
    setSelected(saved);
    setCreating(false);
    setTab("edit");
  }

  function handleTransferred() {
    load();
    setSelected(null);
  }

  return (
    <div className="px-8 py-6 h-full flex gap-5 overflow-hidden">
      {/* Brand list */}
      <section className="w-64 shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-semibold text-gray-900">Brands</h1>
          <button
            onClick={() => { setCreating(true); setSelected(null); setTab("edit"); }}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            + New
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-gray-400 px-2">Loading…</p>
          ) : brands.length === 0 ? (
            <p className="text-xs text-gray-400 px-2">No brands yet.</p>
          ) : (
            brands.map((b) => (
              <button
                key={b.id}
                onClick={() => { setSelected(b); setCreating(false); setTab("edit"); }}
                className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                  selected?.id === b.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                <p className="text-xs text-gray-400 font-mono truncate">/{b.slug}</p>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Detail panel */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
        {creating ? (
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">New brand</h2>
            <BrandForm onSaved={handleSaved} onCancel={() => setCreating(false)} />
          </div>
        ) : selected ? (
          <>
            <div className="px-6 pt-5 pb-0 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">{selected.name}</h2>
                <button
                  onClick={() => handleDelete(selected)}
                  disabled={deleting}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  Delete brand
                </button>
              </div>
              <div className="flex gap-4">
                {(["edit", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`pb-2 text-xs font-medium capitalize border-b-2 transition-colors ${
                      tab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t === "transfer" ? "Transfer ownership" : "Edit"}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {tab === "edit" ? (
                <BrandForm key={selected.id} brand={selected} onSaved={handleSaved} />
              ) : (
                <TransferForm brand={selected} onTransferred={handleTransferred} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <p className="text-sm text-gray-400">
              {brands.length === 0 ? "You don't have any brands yet." : "Select a brand to edit."}
            </p>
            {brands.length === 0 && (
              <button
                onClick={() => { setCreating(true); setSelected(null); setTab("edit"); }}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700"
              >
                Create your first brand
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
