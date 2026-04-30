"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { UserShell } from "@/components/user-shell";
import * as devApi from "@/lib/developer";

export default function SettingsDeveloperPage() {
  const [webhook, setWebhook] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res: any = await devApi.getWebhookConfig();
      setWebhook(res?.url ?? res?.webhookUrl ?? "");
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      await devApi.updateWebhookConfig({ url: webhook });
      setMessage("Webhook saved.");
    } catch (e: any) {
      setMessage(e?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <UserShell>
      <header className="mb-6 flex items-start gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f0f7ff] text-[#002f6c]">
          <KeyRound className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-normal text-[#001b44]">Developer & API</h1>
          <p className="mt-1 text-sm text-[#434750]">Manage API access, keys, and webhooks for integrations.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-[#e8eaf2] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#001b44]">Developer dashboard</h2>
          <p className="mt-2 text-sm text-[#64748b]">Generate API keys, configure webhooks, and inspect request logs.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/developer" className="rounded-lg bg-[#69ff87] px-3 py-2 text-sm font-semibold text-[#002108]">Open Developer Dashboard</Link>
            <Link href="/developer" className="rounded-lg border px-3 py-2 text-sm">Manage keys</Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e8eaf2] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#001b44]">Webhook</h2>
          <p className="mt-2 text-sm text-[#64748b]">Delivery endpoint for asynchronous events (escrow updates, disputes).</p>
          <input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://your.app/hooks" className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <div className="mt-3 flex items-center gap-3">
            <button onClick={save} disabled={saving} className="rounded-lg bg-[#69ff87] px-3 py-2 text-sm font-semibold text-[#002108]">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={load} disabled={loading} className="rounded-lg border px-3 py-2 text-sm">{loading ? 'Loading...' : 'Reload'}</button>
            {message && <div className="text-sm text-green-600">{message}</div>}
          </div>
        </section>
      </div>
    </UserShell>
  );
}
