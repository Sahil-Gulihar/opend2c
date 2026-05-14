"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">{title}</p>
      {children}
    </div>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent]     = useState("");
  const [next, setNext]           = useState("");
  const [confirm, setConfirm]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError("New passwords don't match"); return; }
    if (next.length < 8)  { setError("Password must be at least 8 characters"); return; }
    setSaving(true);
    setError("");
    setSuccess(false);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.message ?? b.error ?? "Could not update password");
      return;
    }
    setSuccess(true);
    setCurrent(""); setNext(""); setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Current password</label>
        <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">New password</label>
        <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm new password</label>
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
      </div>
      {error   && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-emerald-600 font-medium">Password updated successfully.</p>}
      <div className="pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="px-8 py-6 max-w-2xl space-y-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your account</p>
      </div>

      <Section title="Password">
        <ChangePasswordForm />
      </Section>

      <Section title="Session">
        <p className="text-xs text-gray-500 mb-3">Sign out of your account on this device.</p>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </Section>
    </div>
  );
}
