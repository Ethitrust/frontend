"use client";

import { Gavel, MessageSquare, Paperclip, Send } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";
import { useState, use, useEffect } from "react";
import { notFound } from "next/navigation";

const MOCK_DISPUTES: Record<string, any> = {
  "DSP-2023-0092": {
    id: "DSP-2023-0092",
    escrowId: "ETH-2023-8841",
    counterparty: "Alem Coffee Exporters",
    status: "Mediation",
    summary: "Buyer reports partial delivery against a two-pallet contract. Seller uploaded forwarding documents. Next step: attach carrier verification and propose a split release or full hold until second truck is confirmed.",
    tags: ["Partial delivery", "Logistics evidence"],
    initialThread: [
      { who: "You", time: "Oct 23 · 14:02", body: "Only one pallet arrived; the packing list shows two.", isMe: true },
      { who: "Alem Coffee Exporters", time: "Oct 23 · 16:40", body: "Forwarding bill of lading and warehouse release — second truck is in transit.", isMe: false },
      { who: "EthiTrust Mediator", time: "Oct 24 · 09:05", body: "Requesting logistics verification from carrier; provisional hold on 40% release.", isMe: false, isSystem: true },
    ]
  },
  "DSP-2023-0093": {
    id: "DSP-2023-0093",
    escrowId: "ETH-2023-8842",
    counterparty: "Global Tech PLC",
    status: "Escalated",
    summary: "Buyer claims source code is incomplete and fails to compile. Seller states environmental setup is required as per docs.",
    tags: ["Quality dispute", "Digital goods"],
    initialThread: [
      { who: "You", time: "Sep 20 · 09:15", body: "The source code bundle is missing the backend services folder.", isMe: true },
      { who: "Global Tech PLC", time: "Sep 20 · 11:30", body: "The backend is in a separate repo linked in the README.", isMe: false },
    ]
  }
};

export default function DisputeCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const data = MOCK_DISPUTES[id];

  const [message, setMessage] = useState("");
  const [thread, setThread] = useState<any[]>(data ? data.initialThread : []);

  if (!data) {
    notFound();
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const now = new Date();
    const timeString = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()} · ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMessage = {
      who: "You",
      time: timeString,
      body: message,
      isMe: true
    };

    setThread([...thread, newMessage]);
    setMessage("");
  };

  return (
    <UserShell>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-[#ffdad64d] text-[#ba1a1a]">
            <Gavel className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Case file</p>
            <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">{data.id}</h1>
            <p className="mt-1 text-sm text-[#434750]">Escrow {data.escrowId} · {data.counterparty}</p>
          </div>
        </div>
        <span className={`inline-flex rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider ${
          data.status === "Mediation" ? "bg-[#ffdad64d] text-[#ba1a1a]" : "bg-amber-100 text-amber-800"
        }`}>
          {data.status}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-lg font-normal text-[#001b44]">Summary</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#434750]">
              {data.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {data.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-[#f2f3ff] px-3 py-1 text-xs font-medium text-[#002f6c]">{tag}</span>
              ))}
            </div>
          </section>

          {data.id === "DSP-2023-0092" && (
            <section className="rounded-3xl border border-[#ffdad6] bg-[#fff0ee] p-6 sm:p-8">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-medium text-[#ba1a1a]">Tamper Detection (Auto-Analysis)</h2>
                <span className="rounded-full bg-[#ba1a1a] px-3 py-1 text-xs font-bold text-white">High Risk</span>
              </header>
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-[#ffdad6]">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-bold text-[#001b44]">warehouse_receipt_scan.jpg</p>
                      <p className="text-xs text-[#64748b]">Uploaded by {data.counterparty}</p>
                    </div>
                    <div className="space-y-1 text-xs text-[#ba1a1a]">
                      <p className="flex items-center gap-1 font-medium">⚠️ EXIF Software tag detected: Adobe Photoshop CS6</p>
                      <p className="flex items-center gap-1 font-medium">⚠️ Error Level Analysis (ELA) max diff: 89 (Threshold: 50)</p>
                    </div>
                  </div>
                  <button type="button" className="text-xs font-semibold text-[#002f6c] underline-offset-2 hover:underline">
                    View Metadata
                  </button>
                </div>
                
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-[#e8eaf2]">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-bold text-[#001b44]">packing_list.pdf</p>
                      <p className="text-xs text-[#64748b]">Uploaded by You</p>
                    </div>
                    <p className="text-xs font-medium text-[#146c2e]">✓ Verified (No editing software detected)</p>
                  </div>
                  <button type="button" className="text-xs font-semibold text-[#002f6c] underline-offset-2 hover:underline">
                    View Metadata
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="flex flex-col h-[500px] overflow-hidden rounded-3xl border border-[#e8eaf2] bg-white">
            <header className="flex items-center gap-2 border-b border-[#f2f3ff] px-6 py-4 shrink-0 bg-[#f8fafc]">
              <MessageSquare className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
              <h2 className="font-heading text-lg font-normal text-[#001b44]">Dispute Room (Real-time)</h2>
              <div className="ml-auto flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Connected</span>
              </div>
            </header>
            
            <ul className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {thread.map((m, i) => (
                <li key={i} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-[#001b44]">{m.who}</span>
                    <span className="text-[10px] text-[#64748b]">{m.time}</span>
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                    m.isSystem 
                      ? 'bg-amber-100/50 border border-amber-200 text-amber-900 font-medium w-full text-center' 
                      : m.isMe 
                        ? 'bg-[#002f6c] text-white rounded-br-none' 
                        : 'bg-white border border-[#e8eaf2] text-[#434750] rounded-bl-none shadow-sm'
                  }`}>
                    {m.body}
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="border-t border-[#e8eaf2] bg-white p-4 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <button
                  type="button"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#c4c6d2] bg-slate-50 text-[#64748b] hover:bg-slate-100 transition-colors"
                  title="Attach evidence"
                >
                  <Paperclip className="size-4" strokeWidth={2} aria-hidden />
                </button>
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 rounded-xl border border-[#c4c6d2] bg-white px-4 text-sm focus:border-[#002f6c] focus:outline-none focus:ring-1 focus:ring-[#002f6c]"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#002f6c] text-white hover:bg-[#001b44] disabled:opacity-50 transition-colors"
                >
                  <Send className="size-4 ml-0.5" strokeWidth={2} aria-hidden />
                </button>
              </form>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[#e8eaf2] bg-white p-5 shadow-sm">
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Mediator</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">SM</div>
              <div>
                <p className="font-medium text-[#001b44] text-sm">Sara M. · Trust Ops</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Online</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[#64748b] border-t border-slate-100 pt-3">SLA: first response within 24h.</p>
          </div>
          <div className="rounded-3xl border border-[#e8eaf2] bg-[#f8fafc] p-5">
            <p className="font-heading text-sm font-normal text-[#001b44]">Actions</p>
            <ul className="mt-3 space-y-3 text-sm">
              <li>
                <Link href="/admin/disputes" className="flex items-center gap-2 font-medium text-[#002f6c] hover:text-blue-700 transition-colors">
                  Open admin board
                </Link>
              </li>
              <li>
                <Link href={`/escrow/${data.escrowId}`} className="flex items-center gap-2 font-medium text-[#434750] hover:text-slate-900 transition-colors">
                  View related escrow
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </UserShell>
  );
}
