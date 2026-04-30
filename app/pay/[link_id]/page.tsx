import { notFound } from "next/navigation";
import { ShieldCheck, Lock, CreditCard, Wallet, AlertCircle } from "lucide-react";
import Link from "next/link";
import PayWidget from "./pay-widget";

const MOCK_LINKS: Record<string, any> = {
  "pl_8841": {
    sellerName: "Alem Coffee Exporters",
    description: "Software Development Retainer",
    amount: "12,000.00 ETB",
    status: "Active"
  },
  "pl_8842": {
    sellerName: "Global Tech PLC",
    description: "Coffee Shipment #104",
    amount: "45,000.00 ETB",
    status: "Paid"
  },
  "pl_8843": {
    sellerName: "Addis Designs",
    description: "Consulting Hourly Rate",
    amount: "1,500.00 ETB",
    status: "Active"
  }
};

export default async function PublicCheckoutPage({
  params,
}: {
  params: Promise<{ link_id: string }>;
}) {
  const { link_id } = await params;
  const data = MOCK_LINKS[link_id];

  if (!data) {
    notFound();
  }

  const isPaid = data.status === "Paid";

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col items-center justify-center p-4 sm:p-8 font-sans text-slate-900">
      {/* Brand Header */}
      <div className="mb-8 flex items-center justify-center gap-2">
        <ShieldCheck className="size-8 text-emerald-500" strokeWidth={2} />
        <span className="text-xl font-bold text-[#001b44] tracking-tight">EthiTrust <span className="font-normal text-slate-500 text-sm tracking-normal">Escrow</span></span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-xl shadow-blue-900/5 overflow-hidden border border-slate-100">
        
        {/* Top Section: Amount & Details */}
        <div className="bg-[#0a2540] p-8 text-center text-white relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
          
          <div className="relative z-10">
            <p className="text-blue-200 text-sm font-medium mb-1 uppercase tracking-wider">{data.sellerName}</p>
            <h1 className="text-4xl font-light tracking-tight mb-2">{data.amount}</h1>
            <p className="text-blue-100/80">{data.description}</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          {isPaid ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="size-8 text-emerald-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#001b44] mb-2">Payment Complete</h2>
              <p className="text-slate-500 mb-6">This payment link has already been fulfilled and the funds are secured in escrow.</p>
            </div>
          ) : (
            <PayWidget linkId={link_id} data={data} />
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center flex items-center justify-center gap-2">
          <AlertCircle className="size-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-medium">Secured by Digital Guardian Verification Authority</span>
        </div>
      </div>
      
      {/* Return link for demo purposes */}
      <Link href="/payment-links" className="mt-8 text-sm text-slate-500 hover:text-[#001b44] transition-colors underline underline-offset-4">
        Return to Dashboard (Demo)
      </Link>
    </div>
  );
}
