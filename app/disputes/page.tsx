import Link from "next/link";
import { ArrowRight, Gavel, AlertTriangle, CheckCircle2 } from "lucide-react";
import { UserShell } from "@/components/user-shell";

const disputes = [
  {
    id: "DSP-2023-0092",
    escrowId: "ETH-2023-8841",
    counterparty: "Alem Coffee Exporters",
    issue: "Partial delivery against a two-pallet contract",
    status: "Mediation",
    date: "Oct 23, 2023",
    icon: Gavel,
    colorClass: "bg-[#ffdad64d] text-[#ba1a1a] border-[#ffdad6]",
  },
  {
    id: "DSP-2023-0093",
    escrowId: "ETH-2023-8842",
    counterparty: "Global Tech PLC",
    issue: "Source code does not match requirements",
    status: "Escalated",
    date: "Sep 20, 2023",
    icon: AlertTriangle,
    colorClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "DSP-2023-0090",
    escrowId: "ETH-2023-8835",
    counterparty: "Addis Designs",
    issue: "Missed deadline",
    status: "Resolved",
    date: "Aug 10, 2023",
    icon: CheckCircle2,
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
];

export default function DisputesListPage() {
  return (
    <UserShell>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">My Disputes</h1>
          <p className="mt-1 text-sm text-[#434750]">Track and resolve your active escrow disputes</p>
        </div>
      </header>

      <div className="grid gap-4">
        {disputes.map((dispute) => {
          const Icon = dispute.icon;
          return (
            <Link 
              key={dispute.id} 
              href={`/disputes/${dispute.id}`}
              className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-[#e8eaf2] bg-white p-5 transition-all hover:border-[#cbd5e1] hover:shadow-sm"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${dispute.colorClass} bg-opacity-50`}>
                  <Icon className="size-6" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading text-lg font-medium text-[#001b44]">{dispute.id}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${dispute.colorClass}`}>
                      {dispute.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#434750] truncate">
                    <span className="font-medium text-[#001b44]">{dispute.escrowId}</span> • {dispute.counterparty}
                  </p>
                  <p className="text-xs text-[#64748b] mt-1 truncate">Issue: {dispute.issue}</p>
                </div>
              </div>
              
              <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-6 md:pl-4 mt-2 md:mt-0 border-t border-[#f2f3ff] md:border-t-0 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <div className="text-sm font-medium text-[#001b44]">Updated</div>
                  <div className="text-xs text-[#64748b]">{dispute.date}</div>
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f8fafc] text-[#64748b] group-hover:bg-[#e2e8f0] group-hover:text-[#001b44] transition-colors">
                  <ArrowRight className="size-4" strokeWidth={2} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </UserShell>
  );
}
