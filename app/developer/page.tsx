"use client";

import { Activity, Code2, KeyRound, Link2, Terminal, Plus, Copy, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ApiKey = {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
};

export default function DeveloperDashboardPage() {
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: "key_1", name: "Production Key", key: "sk_live_••••••••8f2a", created: "Oct 10, 2023", lastUsed: "Today" }
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const generateKey = () => {
    const randomHex = Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10);
    const newKey = {
      id: `key_${Date.now()}`,
      name: `Generated Key ${keys.length + 1}`,
      key: `sk_live_${randomHex}`,
      created: "Just now",
      lastUsed: "Never"
    };
    setKeys([newKey, ...keys]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revokeKey = (id: string) => {
    setKeys(keys.filter(k => k.id !== id));
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
            <p className="mt-3 break-all font-mono text-sm text-[#69ff87]">https://api.partner.et/hooks</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/30">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Last Event</p>
            </div>
            <p className="mt-3 break-all font-mono text-sm text-[#69ff87]">escrow.funded · 200 OK</p>
          </article>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
          <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <KeyRound className="size-5 text-[#69ff87]" />
              API Keys
            </h2>
            <button 
              onClick={generateKey}
              className="inline-flex items-center gap-2 rounded-lg bg-[#69ff87]/10 px-4 py-2 text-sm font-semibold text-[#69ff87] hover:bg-[#69ff87]/20 transition-colors"
            >
              <Plus className="size-4" />
              Generate New Key
            </button>
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
                    <td className="px-6 py-4 font-mono text-xs text-[#69ff87]">{k.key}</td>
                    <td className="px-6 py-4 text-slate-500">{k.created}</td>
                    <td className="px-6 py-4 text-slate-500">{k.lastUsed}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button 
                        onClick={() => copyToClipboard(k.key, k.id)}
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
          </div>
          <div className="p-5 font-mono text-xs leading-relaxed text-slate-500">
            <p className="text-slate-400">POST /v1/escrows · 201 · 184ms</p>
            <p>GET /v1/escrows/eth_8841/events · 200 · 42ms</p>
            <p className="mt-4 text-slate-600">SDK traffic and payload replay will stream here.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
