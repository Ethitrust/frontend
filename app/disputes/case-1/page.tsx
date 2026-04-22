import { Gavel, MessageSquare, Paperclip } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

const thread = [
  { who: "You", time: "Oct 23 · 14:02", body: "Only one pallet arrived; the packing list shows two." },
  { who: "Alem Coffee Exporters", time: "Oct 23 · 16:40", body: "Forwarding bill of lading and warehouse release — second truck is in transit." },
  { who: "EthiTrust Mediator", time: "Oct 24 · 09:05", body: "Requesting logistics verification from carrier; provisional hold on 40% release." },
];

export default function DisputeCasePage() {
  return (
    <UserShell>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-[#ffdad64d] text-[#ba1a1a]">
            <Gavel className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Case file · Figma 2:2780</p>
            <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">DSP-2023-0092</h1>
            <p className="mt-1 text-sm text-[#434750]">Escrow ETH-2023-8841 · Alem Coffee Exporters</p>
          </div>
        </div>
        <span className="inline-flex rounded-full bg-[#ffdad64d] px-4 py-2 text-[11px] font-normal uppercase tracking-[-0.275px] text-[#ba1a1a]">
          Mediation
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-lg font-normal text-[#001b44]">Summary</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#434750]">
              Buyer reports partial delivery against a two-pallet contract. Seller uploaded forwarding documents. Next step: attach carrier
              verification and propose a split release or full hold until second truck is confirmed.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#f2f3ff] px-3 py-1 text-xs font-medium text-[#002f6c]">Partial delivery</span>
              <span className="rounded-full bg-[#f2f3ff] px-3 py-1 text-xs font-medium text-[#002f6c]">Logistics evidence</span>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-[#e8eaf2] bg-white">
            <header className="flex items-center gap-2 border-b border-[#f2f3ff] px-6 py-4">
              <MessageSquare className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
              <h2 className="font-heading text-lg font-normal text-[#001b44]">Case thread</h2>
            </header>
            <ul className="divide-y divide-[#f2f3ff]">
              {thread.map((m) => (
                <li key={`${m.who}-${m.time}`} className="px-6 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#001b44]">{m.who}</p>
                    <p className="text-xs text-[#64748b]">{m.time}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#434750]">{m.body}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#f2f3ff] bg-[#faf8ff]/80 px-6 py-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#c4c6d2] bg-white px-4 py-3 text-sm font-medium text-[#002f6c]"
              >
                <Paperclip className="size-4" strokeWidth={1.75} aria-hidden />
                Attach evidence
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[#e8eaf2] bg-white p-5">
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Mediator</p>
            <p className="mt-2 font-medium text-[#001b44]">Sara M. · Trust Ops</p>
            <p className="mt-1 text-sm text-[#434750]">SLA: first response within 24h.</p>
          </div>
          <div className="rounded-3xl border border-[#e8eaf2] bg-[#f2f3ff] p-5">
            <p className="font-heading text-sm font-normal text-[#001b44]">Actions</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/admin/disputes" className="font-semibold text-[#002f6c] underline-offset-2 hover:underline">
                  Open admin board
                </Link>
              </li>
              <li>
                <Link href="/escrow/tx-1" className="text-[#434750] underline-offset-2 hover:underline">
                  View escrow
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </UserShell>
  );
}
