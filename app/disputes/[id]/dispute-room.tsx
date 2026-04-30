"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import { getDispute, getMessages, postMessage, resolveDispute, escalateDispute } from "@/lib/disputes";
import { fetchApi } from "@/lib/api";
import { uploadFileToUrl } from "@/lib/upload";

export default function DisputeRoom({ disputeId }: { disputeId: string }) {
  const [dispute, setDispute] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const d: any = await getDispute(disputeId);
        if (!mounted) return;
        setDispute(d);
      } catch (e: any) {
        // ignore
      }

      try {
        const msgs: any = await getMessages(disputeId);
        if (!mounted) return;
        setMessages(msgs || []);
        scrollToBottom();
      } catch (e: any) {
        // ignore
      }

      connectWs();
    }

    init();

    return () => {
      mounted = false;
      disconnectWs();
    };
  }, [disputeId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 50);
  };

  const connectWs = () => {
    try {
      const base = (process.env.NEXT_PUBLIC_WS_URL as string) || `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
      const url = `${base.replace(/\/$/, "")}/ws/disputes/${disputeId}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.type === "message") {
            setMessages((m) => [...m, payload.message]);
            scrollToBottom();
          } else if (payload.type === "dispute_updated") {
            setDispute(payload.dispute);
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // try reconnect after short delay
        setTimeout(() => connectWs(), 3000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch (e) {
      setConnected(false);
    }
  };

  const disconnectWs = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    setConnected(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    setError(null);
    const body = input.trim();
    try {
      const attachments: string[] = [];
      // Send via WS if available
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "message", body, attachments }));
      } else {
        await postMessage(disputeId, { body, attachments });
      }
      setInput("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const uploaded: string[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const presign = await fetchApi("/uploads/presign", {
          method: "POST",
          body: JSON.stringify({ filename: file.name, content_type: file.type, purpose: "dispute_attachment" }),
        });
        const uploadUrl = presign.upload_url ?? presign.uploadUrl ?? presign.url;
        const fileUrl = presign.file_url ?? presign.fileUrl ?? presign.url;
        await uploadFileToUrl(file, uploadUrl, () => {});
        uploaded.push(fileUrl);
      } catch (e: any) {
        setError(e?.message ?? "Failed to upload attachment");
      }
    }

    if (uploaded.length > 0) {
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "message", body: "", attachments: uploaded }));
        } else {
          await postMessage(disputeId, { body: "", attachments: uploaded });
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to send attachments");
      }
    }
  };

  const handleResolve = async () => {
    if (!confirm("Resolve dispute and apply recommended resolution?")) return;
    try {
      await resolveDispute(disputeId, { resolution: "resolved_by_mediator" });
      const d = await getDispute(disputeId);
      setDispute(d);
    } catch (e: any) {
      setError(e?.message ?? "Failed to resolve dispute");
    }
  };

  const handleEscalate = async () => {
    if (!confirm("Escalate dispute to arbitration?")) return;
    try {
      await escalateDispute(disputeId, { reason: "Requested escalation from UI" });
      const d = await getDispute(disputeId);
      setDispute(d);
    } catch (e: any) {
      setError(e?.message ?? "Failed to escalate dispute");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
          <h2 className="font-heading text-lg font-normal text-[#001b44]">{dispute?.id ?? `Dispute ${disputeId}`}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#434750]">{dispute?.summary ?? "Loading dispute details..."}</p>
        </section>

        <section className="flex flex-col h-[520px] overflow-hidden rounded-3xl border border-[#e8eaf2] bg-white">
          <header className="flex items-center gap-2 border-b border-[#f2f3ff] px-6 py-4 shrink-0 bg-[#f8fafc]">
            <MessageSquare className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
            <h3 className="font-heading text-lg font-normal text-[#001b44]">Dispute Room</h3>
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${connected ? 'text-emerald-600' : 'text-slate-500'}`}>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </header>

          <ul ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {messages.map((m: any, i: number) => (
              <li key={i} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  <span className="text-xs font-semibold text-[#001b44]">{m.who}</span>
                  <span className="text-[10px] text-[#64748b]">{m.time}</span>
                </div>
                <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed ${m.isMe ? 'bg-[#002f6c] text-white rounded-br-none' : 'bg-white border border-[#e8eaf2] text-[#434750] rounded-bl-none shadow-sm'}`}>
                  {m.body}
                  {m.attachments?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.attachments.map((a: string, idx: number) => (
                        <div key={idx} className="text-xs text-blue-700 underline"><a href={a} target="_blank" rel="noopener noreferrer">Attachment {idx + 1}</a></div>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-[#e8eaf2] bg-white p-4 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#c4c6d2] bg-slate-50 text-[#64748b] hover:bg-slate-100 transition-colors" title="Attach evidence">
                <Paperclip className="size-4" strokeWidth={2} aria-hidden />
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleAttach(e.target.files)} />
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="flex-1 rounded-xl border border-[#c4c6d2] bg-white px-4 text-sm focus:border-[#002f6c] focus:outline-none focus:ring-1 focus:ring-[#002f6c]" />
              <button type="submit" disabled={!input.trim() || sending} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#002f6c] text-white hover:bg-[#001b44] disabled:opacity-50 transition-colors">
                <Send className="size-4 ml-0.5" strokeWidth={2} aria-hidden />
              </button>
            </form>
            {error && <div className="mt-2 text-sm text-[#ba1a1a]">{error}</div>}
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-[#e8eaf2] bg-white p-5 shadow-sm">
          <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Mediator</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">SM</div>
            <div>
              <p className="font-medium text-[#001b44] text-sm">{dispute?.mediator_name ?? 'Sara M.'} · Trust Ops</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">{dispute?.mediator_status ?? 'Online'}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-[#64748b] border-t border-slate-100 pt-3">SLA: first response within 24h.</p>
        </div>

        <div className="rounded-3xl border border-[#e8eaf2] bg-[#f8fafc] p-5">
          <p className="font-heading text-sm font-normal text-[#001b44]">Actions</p>
          <ul className="mt-3 space-y-3 text-sm">
            <li>
              <button onClick={handleResolve} className="w-full rounded-xl bg-[#69ff87] py-2 text-sm font-bold text-[#002108] hover:bg-[#52e87c] transition-colors">Resolve dispute</button>
            </li>
            <li>
              <button onClick={handleEscalate} className="w-full rounded-xl border border-[#c4c6d2] bg-white py-2 text-sm font-semibold text-[#ba1a1a] hover:bg-slate-50 transition-colors">Escalate to arbitration</button>
            </li>
            <li>
              <Link href={`/escrow/${dispute?.escrowId ?? ''}`} className="flex items-center gap-2 font-medium text-[#434750] hover:text-slate-900 transition-colors">View related escrow</Link>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
