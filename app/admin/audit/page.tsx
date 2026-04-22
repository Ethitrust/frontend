import { ScrollText } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

const events = [
  { actor: "system", action: "policy_pack_updated", target: "fraud_v3", ts: "2026-04-22 08:12 UTC" },
  { actor: "analyst@ethitrust.et", action: "case_assigned", target: "DSP-2023-0092", ts: "2026-04-22 07:55 UTC" },
  { actor: "api_key_***", action: "webhook_retry", target: "partner_acme", ts: "2026-04-22 07:41 UTC" },
];

export default function AdminAuditPage() {
  return (
    <AdminShell>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
          <ScrollText className="size-8 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
          System audit intelligence
        </h1>
        <p className="mt-1 text-sm text-slate-400">Immutable log highlights · Figma 2:1926</p>
      </header>

      <ul className="space-y-3">
        {events.map((e) => (
          <li
            key={`${e.ts}-${e.action}`}
            className="rounded-xl border border-slate-700 bg-slate-900/50 px-5 py-4 text-sm shadow-md shadow-black/10"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-xs text-[#69ff87]">{e.ts}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">{e.actor}</span>
              <span className="text-slate-600">→</span>
              <span className="font-semibold text-white">{e.action}</span>
              <span className="text-slate-500">({e.target})</span>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
