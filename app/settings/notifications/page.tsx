"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { UserShell } from "@/components/user-shell";
import { fetchApi } from "@/lib/api";

type NotificationsSettings = {
  email: boolean;
  sms: boolean;
  push: boolean;
  escrow_events: boolean;
  dispute_updates: boolean;
  weekly_summary: boolean;
};

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationsSettings>({
    email: true,
    sms: false,
    push: false,
    escrow_events: true,
    dispute_updates: true,
    weekly_summary: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const res: any = await fetchApi("/settings/notifications");
      if (res) setSettings((s) => ({ ...s, ...(res || {}) }));
    } catch (e) {
      setError("Failed to load notification settings.");
    } finally {
      setLoading(false);
    }
  }

  function toggle<K extends keyof NotificationsSettings>(key: K) {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await fetchApi("/settings/notifications", { method: "PUT", body: JSON.stringify(settings) });
      setMessage("Preferences saved.");
    } catch (e: any) {
      setError(e?.body?.message ?? e?.message ?? "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <UserShell>
      <header className="mb-6 flex items-start gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f0f7ff] text-[#002f6c]">
          <Bell className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-normal text-[#001b44]">Notifications</h1>
          <p className="mt-1 text-sm text-[#434750]">Manage how you receive alerts and summaries from EthiTrust.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-[#e8eaf2] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#001b44]">Channels</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#001b44]">Email</div>
                <div className="text-xs text-[#64748b]">Important updates and receipts</div>
              </div>
              <input type="checkbox" checked={settings.email} onChange={() => toggle('email')} />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#001b44]">SMS</div>
                <div className="text-xs text-[#64748b]">Short SMS alerts for critical events</div>
              </div>
              <input type="checkbox" checked={settings.sms} onChange={() => toggle('sms')} />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#001b44]">Push</div>
                <div className="text-xs text-[#64748b]">Browser or mobile push notifications</div>
              </div>
              <input type="checkbox" checked={settings.push} onChange={() => toggle('push')} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e8eaf2] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#001b44]">Event preferences</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#001b44]">Escrow events</div>
                <div className="text-xs text-[#64748b]">Payments, funding, and release notifications</div>
              </div>
              <input type="checkbox" checked={settings.escrow_events} onChange={() => toggle('escrow_events')} />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#001b44]">Dispute updates</div>
                <div className="text-xs text-[#64748b]">Messages and status changes in disputes</div>
              </div>
              <input type="checkbox" checked={settings.dispute_updates} onChange={() => toggle('dispute_updates')} />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#001b44]">Weekly summary</div>
                <div className="text-xs text-[#64748b]">Receive weekly activity digests</div>
              </div>
              <input type="checkbox" checked={settings.weekly_summary} onChange={() => toggle('weekly_summary')} />
            </label>
          </div>
        </section>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-lg bg-[#69ff87] px-4 py-2 text-sm font-semibold text-[#002108]">
          {saving ? "Saving..." : "Save preferences"}
        </button>
        <button onClick={loadSettings} disabled={loading} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">{loading ? "Loading..." : "Reload"}</button>
        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </UserShell>
  );
}
