import Link from "next/link";
import { ArrowRight, Box, CheckCircle2, Clock, XCircle } from "lucide-react";
import { UserShell } from "@/components/user-shell";

const escrows = [
  {
    id: "ETH-2023-8841",
    role: "Buyer",
    counterparty: "Alem Coffee Exporters",
    amount: "42,500.00 ETB",
    status: "In escrow",
    date: "Oct 18, 2023",
    icon: Clock,
    colorClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "ETH-2023-8842",
    role: "Seller",
    counterparty: "Global Tech PLC",
    amount: "15,000.00 ETB",
    status: "Completed",
    date: "Sep 12, 2023",
    icon: CheckCircle2,
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "ETH-2023-8843",
    role: "Buyer",
    counterparty: "Addis Designs",
    amount: "5,000.00 ETB",
    status: "Cancelled",
    date: "Aug 05, 2023",
    icon: XCircle,
    colorClass: "bg-slate-100 text-slate-600 border-slate-200",
  }
];

export default function EscrowListPage() {
  return (
    <UserShell>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">My Escrows</h1>
          <p className="mt-1 text-sm text-[#434750]">Manage your active and past transactions</p>
        </div>
        <Link 
          href="/escrow/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#69ff87] px-5 py-2.5 text-sm font-bold text-[#002108] transition-all hover:bg-[#52e87c] shadow-sm hover:shadow-md"
        >
          New Escrow
        </Link>
      </header>

      <div className="grid gap-4">
        {escrows.map((escrow) => {
          const Icon = escrow.icon;
          return (
            <Link 
              key={escrow.id} 
              href={`/escrow/${escrow.id}`}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#e8eaf2] bg-white p-5 transition-all hover:border-[#cbd5e1] hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f8fafc] group-hover:bg-[#f1f5f9] transition-colors">
                  <Box className="size-6 text-[#001b44]" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading text-lg font-medium text-[#001b44]">{escrow.id}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${escrow.colorClass}`}>
                      <Icon className="size-3" strokeWidth={2} />
                      {escrow.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#434750]">
                    <span className="font-medium">{escrow.role}</span> with {escrow.counterparty}
                  </p>
                </div>
              </div>
              <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 sm:pl-4">
                <div className="text-left sm:text-right">
                  <div className="font-heading text-lg font-normal text-[#002f6c]">{escrow.amount}</div>
                  <div className="text-xs text-[#64748b]">{escrow.date}</div>
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
