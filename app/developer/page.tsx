"use client";

import { Activity, Code2, KeyRound, Link2, Terminal, Plus, Copy, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import * as devApi from "@/lib/developer";

type ApiKey = {
  id: string;
  name: string;
  key?: string; // may be masked by server
  created?: string;
  last_used?: string | null;
};

function maskKey(k?: string) {
  if (!k) return "sk_••••••••••";
  // if already masked
  if (k.includes("•")) return k;
  const last = k.slice(-6);
  return `${k.slice(0, 6)}••••••${last}`;
}

export default function DeveloperDashboardPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [webhook, setWebhook] = useState<string>("");
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const k = await devApi.listApiKeys();
      const keyList = Array.isArray(k) ? k : k?.items ?? [];
      setKeys(keyList.map((it: any) => ({ id: it.id, name: it.name, key: it.key ?? maskKey(it.key), created: it.created_at ?? it.created, last_used: it.last_used ?? it.lastUsed })));
      try {
        const wh = await devApi.getWebhookConfig();
        setWebhook(wh?.url ?? wh?.webhookUrl ?? "");
      } catch (e) {
        setWebhook("");
      }
      try {
        const l = await devApi.getRequestLogs(20);
        const list = Array.isArray(l) ? l : l?.items ?? [];
        setLogs(list as any[]);
      } catch (e) {
        setLogs([]);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const generateKey = async () => {
    const name = prompt("Name for new API key (e.g. 'Production service')") || `Key ${Date.now()}`;
    setLoading(true);
    try {
      const res = await devApi.createApiKey(name);
      // server should return { id, key, name, created_at }
      const createdKey = res ?? {};
      const secret = createdKey.key ?? createdKey.secret;
      if (secret) {
        // show one-time secret to user
        try {
          await navigator.clipboard.writeText(secret);
          alert("New key created and copied to clipboard. Store it securely — it won't be shown again.");
        } catch (_) {
          alert(`New key: ${secret}\nCopy it now — it will not be shown again.`);
        }
      }
      // show masked in list
      const entry = { id: createdKey.id, name: createdKey.name || name, key: maskKey(createdKey.key ?? createdKey.secret), created: createdKey.created_at ?? "Just now", last_used: null };
      setKeys((ks) => [entry as ApiKey, ...ks]);
    } catch (err: any) {
      alert(`Failed to create key: ${err?.message ?? err}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      alert("Copy failed");
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    setLoading(true);
    try {
      await devApi.revokeApiKey(id);
      setKeys((ks) => ks.filter((k) => k.id !== id));
    } catch (err: any) {
      alert(`Revoke failed: ${err?.message ?? err}`);
    } finally {
      setLoading(false);
    }
  };

  const saveWebhook = async () => {
    setLoading(true);
    try {
      await devApi.updateWebhookConfig({ url: webhook });
      alert("Webhook saved.");
    } catch (err: any) {
      alert(`Save failed: ${err?.message ?? err}`);
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    setLoading(true);
    try {
      const res = await devApi.testWebhookDelivery({ url: webhook });
      alert(`Test webhook response: ${JSON.stringify(res)}`);
    } catch (err: any) {
      alert(`Webhook test failed: ${err?.message ?? err}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshLogs = async () => {
    setLoading(true);
    try {
      const l = await devApi.getRequestLogs(50);
      const list = Array.isArray(l) ? l : l?.items ?? [];
      setLogs(list as any[]);
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] px-6 py-10 text-slate-200">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-800 text-[#69ff87]">
              <Code2 className="size-7" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">B2B · Figma 2:2241</p>
              <h1 className="mt-1 text-3xl font-bold text-white">Developer dashboard</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">API posture, keys, and signed request visibility for partner integrations.</p>
            </div>
          </div>
          <Link href="/business" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-[#69ff87] hover:border-[#69ff87]/50">
            ← Business Dashboard
          </Link>
        </header>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/30">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active Keys</p>
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold text-[#69ff87]">{keys.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/30">
            <div className="flex items-center gap-2">
              <Link2 className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Webhook URL</p>
            </div>
            <input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://your.partner/hooks" className="mt-3 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 font-mono text-sm text-[#69ff87]" />
            <div className="mt-3 flex gap-2">
              <button onClick={saveWebhook} className="rounded-lg bg-[#69ff87]/10 px-3 py-2 text-sm font-semibold text-[#69ff87] hover:bg-[#69ff87]/20">Save</button>
              <button onClick={testWebhook} className="rounded-lg bg-white/5 px-3 py-2 text-sm">Send test</button>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/30">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Last Event</p>
            </div>
            <p className="mt-3 break-all font-mono text-sm text-[#69ff87]">{logs[0] ? `${logs[0].method} ${logs[0].path} · ${logs[0].status}` : 'No recent events'}</p>
          </article>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
          <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <KeyRound className="size-5 text-[#69ff87]" />
              API Keys
            </h2>
            <div className="flex items-center gap-3">
              <button disabled={loading} onClick={generateKey} className="inline-flex items-center gap-2 rounded-lg bg-[#69ff87]/10 px-4 py-2 text-sm font-semibold text-[#69ff87] hover:bg-[#69ff87]/20 transition-colors">
                <Plus className="size-4" />
                Generate New Key
              </button>
              <button onClick={loadAll} className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">Refresh</button>
            </div>
          </header>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-xs font-medium uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Secret Key</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Last Used</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-300">{k.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-[#69ff87]">{maskKey(k.key)}</td>
                    <td className="px-6 py-4 text-slate-500">{k.created ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-500">{k.last_used ?? "—"}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button 
                        onClick={() => copyToClipboard(k.key ?? maskKey(k.key), k.id)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copy key"
                      >
                        {copiedId === k.id ? <Check className="size-4 text-[#69ff87]" /> : <Copy className="size-4" />}
                      </button>
                      <button 
                        onClick={() => revokeKey(k.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Revoke key"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No active API keys. Generate one to authenticate your requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3">
            <Terminal className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden />
            <h2 className="text-sm font-semibold text-white">Request log</h2>
            <button onClick={refreshLogs} className="ml-auto text-xs text-slate-400">Refresh</button>
          </div>
          <div className="p-5 font-mono text-xs leading-relaxed text-slate-500">
            {logs.length === 0 && <p className="text-slate-400">No recent requests.</p>}
            {logs.map((l, i) => (
              <p key={i} className={`${i === 0 ? 'text-slate-400' : ''}`}>{`${l.method} ${l.path} · ${l.status} · ${l.latency_ms ?? l.time_ms ?? ''}ms`}</p>
            ))}
            <p className="mt-4 text-slate-600">SDK traffic and payload replay will stream here.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
