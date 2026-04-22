import { FlaskConical, Share2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

export default function AdminForensicsPage() {
  return (
    <AdminShell>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
            <FlaskConical className="size-8 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
            Forensic AI analysis
          </h1>
          <p className="mt-1 text-sm text-slate-400">Graph + narrative · Figma 2:1336</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
        >
          <Share2 className="size-4" strokeWidth={1.75} aria-hidden />
          Export bundle
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-700 bg-slate-900/40 p-6">
          <p className="text-sm font-semibold text-[#69ff87]">Risk graph</p>
          <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-950 text-sm text-slate-500">
            Force-directed graph placeholder — devices, accounts, counterparties
          </div>
        </section>
        <section className="rounded-2xl border border-slate-700 bg-slate-900/40 p-6">
          <p className="text-sm font-semibold text-[#69ff87]">Model narrative</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Structured rationale with SHAP-style attributions, recommended human checkpoints, and chain-of-custody for each evidence artifact will
            render in this panel once the backend is wired.
          </p>
          <ul className="mt-6 space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
            <li>• Model version: fraud_v3.2 · calibrated 2026-04-01</li>
            <li>• Last human review: analyst@ethitrust.et</li>
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
