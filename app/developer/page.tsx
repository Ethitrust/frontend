import { Activity, Code2, KeyRound, Link2, Terminal } from "lucide-react";
import Link from "next/link";

const devTiles: { k: string; v: string; Icon: typeof KeyRound }[] = [
  { k: "Production key", v: "eth_live_••••••••8f2a", Icon: KeyRound },
  { k: "Webhook URL", v: "https://api.partner.et/hooks/ethitrust", Icon: Link2 },
  { k: "Last event", v: "escrow.funded · 200 OK", Icon: Activity },
];

export default function DeveloperDashboardPage() {
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
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-[#69ff87] hover:border-[#69ff87]/50">
            ← Marketing site
          </Link>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {devTiles.map((row) => {
            const { Icon } = row;
            return (
              <article key={row.k} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/30">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden />
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.k}</p>
                </div>
                <p className="mt-3 break-all font-mono text-sm text-[#69ff87]">{row.v}</p>
              </article>
            );
          })}
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
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
