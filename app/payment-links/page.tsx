import { Copy, Link as LinkIcon, Plus, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

const paymentLinks = [
  {
    id: "pl_8841",
    title: "Software Development Retainer",
    amount: "12,000.00 ETB",
    status: "Active",
    created: "Oct 25, 2023",
    uses: 1,
  },
  {
    id: "pl_8842",
    title: "Coffee Shipment #104",
    amount: "45,000.00 ETB",
    status: "Paid",
    created: "Oct 22, 2023",
    uses: 1,
  },
  {
    id: "pl_8843",
    title: "Consulting Hourly Rate",
    amount: "1,500.00 ETB",
    status: "Active",
    created: "Sep 15, 2023",
    uses: 4,
  }
];

export default function PaymentLinksPage() {
  return (
    <UserShell>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">Payment Links</h1>
          <p className="mt-1 text-sm text-[#434750]">Create and share payment links to get paid securely</p>
        </div>
        <button 
          className="inline-flex items-center gap-2 rounded-xl bg-[#69ff87] px-5 py-2.5 text-sm font-bold text-[#002108] transition-all hover:bg-[#52e87c] shadow-sm hover:shadow-md"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          New Link
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paymentLinks.map((link) => (
          <div key={link.id} className="rounded-2xl border border-[#e8eaf2] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <LinkIcon className="size-5" strokeWidth={2} />
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                link.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                {link.status === "Active" ? <Clock className="size-3" /> : <CheckCircle2 className="size-3" />}
                {link.status}
              </span>
            </div>
            
            <h3 className="font-heading text-lg font-medium text-[#001b44] mb-1 truncate">{link.title}</h3>
            <div className="font-heading text-2xl font-normal text-[#002f6c] mb-4">{link.amount}</div>
            
            <div className="flex items-center justify-between text-xs text-[#64748b] mb-6">
              <span>Created {link.created}</span>
              <span>{link.uses} payment{link.uses !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#001b44] hover:bg-slate-100 transition-colors">
                <Copy className="size-4" strokeWidth={2} />
                Copy Link
              </button>
              <Link 
                href={`/pay/${link.id}`} 
                target="_blank"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-[#001b44] hover:bg-slate-50 transition-colors"
              >
                Preview
              </Link>
            </div>
          </div>
        ))}
      </div>
    </UserShell>
  );
}
