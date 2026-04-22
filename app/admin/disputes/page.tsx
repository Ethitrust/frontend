import { Gavel } from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";

const cases = [
  { id: "DSP-2023-0092", escrow: "ETH-2023-8841", stage: "Mediation", age: "3d", amount: "42,500" },
  { id: "DSP-2023-0088", escrow: "ETH-2023-8702", stage: "Evidence", age: "1d", amount: "18,200" },
];

export default function AdminDisputesPage() {
  return (
    <AdminShell>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
          <Gavel className="size-8 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
          Dispute resolution
        </h1>
        <p className="mt-1 text-sm text-slate-400">Board view · Figma 2:2510</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/30 shadow-xl shadow-black/20">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-900/90 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">Case</th>
              <th className="px-5 py-4 font-medium">Escrow</th>
              <th className="px-5 py-4 font-medium">Amount (ETB)</th>
              <th className="px-5 py-4 font-medium">Stage</th>
              <th className="px-5 py-4 font-medium">Age</th>
              <th className="px-5 py-4 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {cases.map((c) => (
              <tr key={c.id} className="bg-slate-900/20 hover:bg-slate-800/40">
                <td className="px-5 py-4 font-mono text-[#69ff87]">{c.id}</td>
                <td className="px-5 py-4 text-slate-300">{c.escrow}</td>
                <td className="px-5 py-4 font-medium text-white">{c.amount}</td>
                <td className="px-5 py-4 text-white">{c.stage}</td>
                <td className="px-5 py-4 text-slate-400">{c.age}</td>
                <td className="px-5 py-4 text-right">
                  <Link href="/disputes/case-1" className="text-sm font-semibold text-[#69ff87] hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
