import { Activity, Gavel, LayoutGrid, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";

const tiles = [
  { label: "Open verifications", value: "38", hint: "KYC / KYB queue", Icon: ShieldCheck },
  { label: "Active disputes", value: "12", hint: "Needs analyst", Icon: Gavel },
  { label: "Audit alerts", value: "4", hint: "Last 24h", Icon: Activity },
  { label: "API health", value: "99.2%", hint: "B2B tier", Icon: LayoutGrid },
];

const feed = [
  { t: "08:14", msg: "KYC-4412 moved to manual review (medium AI flag)." },
  { t: "08:02", msg: "Escrow ETH-2023-8841 — release paused by fraud policy v3." },
  { t: "07:51", msg: "Webhook delivery failed ×3 for partner_acme — retry scheduled." },
];

export default function AdminHomePage() {
  return (
    <AdminShell>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
          <LayoutGrid className="size-8 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
          Command center
        </h1>
        <p className="mt-1 text-sm text-slate-400">Main admin dashboard · Figma 2:1066</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.Icon;
          return (
            <article key={t.label} className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{t.label}</p>
                <Icon className="size-5 shrink-0 text-[#69ff87]/90" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{t.value}</p>
              <p className="mt-1 text-xs text-slate-500">{t.hint}</p>
            </article>
          );
        })}
      </div>

      <section className="mt-10 rounded-2xl border border-slate-700 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#69ff87]">Operational feed</h2>
          <Link href="/admin/audit" className="text-xs font-semibold text-slate-400 hover:text-white">
            Full audit log →
          </Link>
        </div>
        <ul className="mt-5 space-y-3">
          {feed.map((row) => (
            <li key={row.msg} className="flex gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3 text-sm">
              <span className="shrink-0 font-mono text-xs text-[#69ff87]">{row.t}</span>
              <span className="text-slate-300">{row.msg}</span>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
