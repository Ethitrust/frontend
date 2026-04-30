import { Bot, CheckCircle2, Circle, FileText, Shield } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";
import { notFound } from "next/navigation";

// Mock data store
const MOCK_ESCROWS: Record<string, any> = {
  "ETH-2023-8841": {
    id: "ETH-2023-8841",
    status: "In escrow",
    statusColor: "bg-[rgba(92,253,128,0.35)] text-[#00732c]",
    title: "Green coffee export — Alem Coffee Exporters",
    amount: "42,500.00 ETB",
    buyer: "You (verified)",
    seller: "Alem Coffee Exporters",
    timeline: [
      { label: "Deal created", time: "Oct 18, 2023 09:12", done: true },
      { label: "Buyer funded escrow", time: "Oct 18, 2023 10:04", done: true },
      { label: "Seller marked delivered", time: "Oct 22, 2023 16:41", done: true },
      { label: "Release pending buyer approval", time: "—", done: false },
    ],
    evidence: [
      { name: "Signed purchase order.pdf", meta: "Uploaded by seller · Oct 22" },
      { name: "Warehouse photos.zip", meta: "3 files · checksum verified" },
    ]
  },
  "ETH-2023-8842": {
    id: "ETH-2023-8842",
    status: "Completed",
    statusColor: "bg-emerald-100 text-emerald-800",
    title: "Software Development Services",
    amount: "15,000.00 ETB",
    buyer: "Global Tech PLC",
    seller: "You (verified)",
    timeline: [
      { label: "Deal created", time: "Sep 12, 2023 14:00", done: true },
      { label: "Buyer funded escrow", time: "Sep 13, 2023 09:15", done: true },
      { label: "Seller marked delivered", time: "Sep 20, 2023 11:30", done: true },
      { label: "Funds released to seller", time: "Sep 21, 2023 10:00", done: true },
    ],
    evidence: [
      { name: "Source code bundle.zip", meta: "Uploaded by seller · Sep 20" },
    ]
  },
  "ETH-2023-8843": {
    id: "ETH-2023-8843",
    status: "Cancelled",
    statusColor: "bg-slate-200 text-slate-800",
    title: "Logo Design",
    amount: "5,000.00 ETB",
    buyer: "You (verified)",
    seller: "Addis Designs",
    timeline: [
      { label: "Deal created", time: "Aug 05, 2023 10:00", done: true },
      { label: "Buyer funded escrow", time: "Aug 05, 2023 11:00", done: true },
      { label: "Cancelled by buyer", time: "Aug 07, 2023 09:00", done: true },
      { label: "Funds returned", time: "Aug 08, 2023 10:00", done: true },
    ],
    evidence: []
  }
};

export default async function EscrowTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const data = MOCK_ESCROWS[id];
  
  if (!data) {
    notFound();
  }

  return (
    <UserShell>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Transaction · {data.id}</p>
          <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">{data.id}</h1>
          <p className="mt-1 text-sm text-[#434750]">{data.title}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-4 py-2 text-[11px] font-normal uppercase tracking-[-0.275px] ${data.statusColor}`}>
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
                <p className="mt-1 text-sm leading-relaxed text-[#434750]">
                  Document hashes match prior shipments for this merchant. Velocity within normal range. No beneficiary change in the last 30 days.
                </p>
              </div>
            </div>
            {data.evidence.length > 0 && (
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
            {data.timeline.map((t: any) => (
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
          
          {data.status === "In escrow" && (
            <div className="mt-8 space-y-2 border-t border-[#e2e8f0] pt-6">
              <button type="button" className="w-full rounded-xl bg-[#69ff87] py-3 text-sm font-bold text-[#002108] hover:bg-[#52e87c] transition-colors">
                Confirm receipt &amp; release
              </button>
              <button type="button" className="w-full rounded-xl border border-[#c4c6d2] bg-white py-3 text-sm font-semibold text-[#001b44] hover:bg-slate-50 transition-colors">
                Open dispute
              </button>
              <Link href="/risk/fraud-warning" className="block pt-2 text-center text-sm font-semibold text-[#ba1a1a] underline-offset-2 hover:underline">
                Simulate fraud warning
              </Link>
            </div>
          )}
        </aside>
      </div>
    </UserShell>
  );
}
