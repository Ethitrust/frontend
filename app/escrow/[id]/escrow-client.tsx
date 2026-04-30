"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Circle, FileText, Shield } from "lucide-react";
import Link from "next/link";
import { getEscrow, fundEscrow, markDelivered, releaseEscrow, openDispute, createMilestone } from "@/lib/escrow";

export default function EscrowClient({ escrowId }: { escrowId: string }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const fetchData = async () => {
    setError(null);
    try {
      const res = await getEscrow(escrowId);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load escrow");
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [escrowId]);

  const startPolling = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => fetchData(), 3000);
  };

  const handleFund = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await fundEscrow(escrowId, { return_url: window.location.href });
      const checkoutUrl = res.checkout_url ?? res.checkoutUrl ?? res.url;
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
        startPolling();
      } else {
        await fetchData();
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to start funding");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    setLoading(true);
    setError(null);
    try {
      await markDelivered(escrowId);
      await fetchData();
    } catch (err: any) {
      setError(err?.message ?? "Failed to mark delivered");
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!confirm("Are you sure you want to release funds to the seller?")) return;
    setLoading(true);
    setError(null);
    try {
      await releaseEscrow(escrowId);
      await fetchData();
    } catch (err: any) {
      setError(err?.message ?? "Failed to release funds");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispute = async () => {
    const reason = prompt("Reason for dispute (brief):");
    if (!reason) return;
    setLoading(true);
    setError(null);
    try {
      await openDispute(escrowId, { reason });
      await fetchData();
    } catch (err: any) {
      setError(err?.message ?? "Failed to open dispute");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async () => {
    const title = prompt("Milestone title:");
    if (!title) return;
    const amt = prompt("Amount (ETB):");
    if (!amt) return;
    const amount_cents = Math.round(parseFloat(amt.replace(/[^\d.]/g, "")) * 100);
    setLoading(true);
    setError(null);
    try {
      await createMilestone(escrowId, { title, amount_cents });
      await fetchData();
    } catch (err: any) {
      setError(err?.message ?? "Failed to create milestone");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-[240px] flex items-center justify-center">
        {error ? <div className="text-sm text-[#ba1a1a]">{error}</div> : <div className="text-sm text-slate-500">Loading escrow...</div>}
      </div>
    );
  }

  const statusColor = data.status_color ?? data.statusColor ?? "bg-slate-200 text-slate-800";

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Transaction · {data.id}</p>
          <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">{data.id}</h1>
          <p className="mt-1 text-sm text-[#434750]">{data.title}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-4 py-2 text-[11px] font-normal uppercase tracking-[-0.275px] ${statusColor}`}>
          {data.status}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-lg font-normal text-[#001b44]">Parties &amp; amounts</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#faf8ff] p-4">
                <dt className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Buyer</dt>
                <dd className="mt-1 font-medium text-[#001b44]">{data.buyer}</dd>
              </div>
              <div className="rounded-2xl bg-[#faf8ff] p-4">
                <dt className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Seller</dt>
                <dd className="mt-1 font-medium text-[#001b44]">{data.seller}</dd>
              </div>
              <div className="rounded-2xl bg-[#faf8ff] p-4 sm:col-span-2">
                <dt className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Held amount</dt>
                <dd className="mt-1 font-heading text-2xl font-normal text-[#002f6c]">{data.amount}</dd>
              </div>
            </dl>
          </section>

          <section className="overflow-hidden rounded-3xl border-2 border-[#006e2a]/25 bg-linear-to-br from-[#f2fff6] to-white">
            <div className="flex items-start gap-4 border-b border-[#69ff87]/25 px-6 py-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#69ff87]/25 text-[#006e2a]">
                <Bot className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="flex items-center gap-2 font-heading text-base font-normal text-[#001b44]">
                  <Shield className="size-4 text-[#00732c]" strokeWidth={2} aria-hidden />
                  AI verification
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#434750]">{data.verification_message ?? "Verification summary not available."}</p>
              </div>
            </div>
            {data.evidence?.length > 0 && (
              <div className="px-6 py-5">
                <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Evidence bundle</p>
                <ul className="mt-3 space-y-2">
                  {data.evidence.map((e: any) => (
                    <li key={e.name} className="flex items-center gap-3 rounded-xl border border-[#e8eaf2] bg-white px-4 py-3">
                      <FileText className="size-5 shrink-0 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#001b44]">{e.name}</p>
                        <p className="text-xs text-[#64748b]">{e.meta}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-[#e8eaf2] bg-[#f8fafc] p-6">
          <h2 className="font-heading text-lg font-normal text-[#001b44]">Timeline</h2>
          <ul className="mt-5 space-y-5">
            {data.timeline?.map((t: any) => (
              <li key={t.label} className="flex gap-3">
                {t.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-[#cbd5e1]" strokeWidth={1.75} aria-hidden />
                )}
                <div>
                  <p className="font-medium text-[#001b44]">{t.label}</p>
                  <p className="text-xs text-[#64748b]">{t.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-3 border-t border-[#e2e8f0] pt-6">
            {data.status === "In escrow" && (
              <>
                <button onClick={handleRelease} type="button" className="w-full rounded-xl bg-[#69ff87] py-3 text-sm font-bold text-[#002108] hover:bg-[#52e87c] transition-colors">Confirm receipt &amp; release</button>
                <button onClick={handleOpenDispute} type="button" className="w-full rounded-xl border border-[#c4c6d2] bg-white py-3 text-sm font-semibold text-[#001b44] hover:bg-slate-50 transition-colors">Open dispute</button>
                <button onClick={handleMarkDelivered} type="button" className="w-full rounded-xl border border-[#c4c6d2] bg-white py-3 text-sm font-semibold text-[#001b44] hover:bg-slate-50 transition-colors">Mark delivered (seller)</button>
                <button onClick={handleFund} disabled={loading} className="w-full rounded-xl bg-[#0a2540] text-white py-3 text-sm font-semibold hover:opacity-95">{loading ? 'Processing…' : 'Fund escrow'}</button>
              </>
            )}

            {data.status === "Pending funding" && (
              <button onClick={handleFund} disabled={loading} className="w-full rounded-xl bg-[#0a2540] text-white py-3 text-sm font-semibold hover:opacity-95">{loading ? 'Processing…' : 'Fund escrow'}</button>
            )}

            <button onClick={handleCreateMilestone} className="w-full rounded-xl border border-[#c4c6d2] bg-white py-3 text-sm font-semibold text-[#001b44] hover:bg-slate-50 transition-colors">Create milestone</button>
            <Link href="/risk/fraud-warning" className="block pt-2 text-center text-sm font-semibold text-[#ba1a1a] underline-offset-2 hover:underline">Simulate fraud warning</Link>
          </div>

          {error && <div className="mt-4 text-sm text-[#ba1a1a]">{error}</div>}
        </aside>
      </div>
    </div>
  );
}
