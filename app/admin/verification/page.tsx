import { ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

const queue = [
  { id: "KYC-4412", name: "Selam Tadesse", type: "Individual", status: "Docs uploaded", risk: "Low" },
  { id: "KYB-8831", name: "Blue Nile Logistics PLC", type: "Business", status: "Manual review", risk: "Med" },
  { id: "KYC-4408", name: "Mikias A.", type: "Individual", status: "AI flag", risk: "Med" },
];

export default function AdminVerificationPage() {
  return (
    <AdminShell>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
          <ShieldCheck className="size-8 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
          Verification review
        </h1>
        <p className="mt-1 text-sm text-slate-400">Admin panel · Figma 2:513</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/30 shadow-xl shadow-black/20">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-900/90 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">ID</th>
              <th className="px-5 py-4 font-medium">Subject</th>
              <th className="px-5 py-4 font-medium">Type</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {queue.map((row) => (
              <tr key={row.id} className="bg-slate-900/20 transition-colors hover:bg-slate-800/50">
                <td className="px-5 py-4 font-mono text-[#69ff87]">{row.id}</td>
                <td className="px-5 py-4 font-medium text-white">{row.name}</td>
                <td className="px-5 py-4 text-slate-400">{row.type}</td>
                <td className="px-5 py-4 text-slate-200">{row.status}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                      row.risk === "Low" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {row.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
