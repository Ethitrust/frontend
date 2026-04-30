import { notFound } from "next/navigation";
import { ShieldCheck, Lock, CreditCard, Wallet, AlertCircle } from "lucide-react";
import Link from "next/link";

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
            <>
              <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-8">
                <Lock className="size-5 text-blue-500 shrink-0" strokeWidth={2} />
                <p className="text-xs text-blue-900/80 leading-relaxed">
                  Your funds will be held securely in escrow. They are only released to the seller once you confirm receipt of the service/goods.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <label className="flex items-center justify-between p-4 border-2 border-emerald-500 bg-emerald-50/30 rounded-xl cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Wallet className="size-5 text-emerald-600" strokeWidth={2} />
                    <span className="font-semibold text-[#001b44]">Telebirr Wallet</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-4 border-emerald-500 bg-white"></div>
                </label>
                
                <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors opacity-60">
                  <div className="flex items-center gap-3">
                    <CreditCard className="size-5 text-slate-500" strokeWidth={2} />
                    <span className="font-medium text-slate-600">Bank Transfer <span className="text-xs font-normal ml-1">(Coming soon)</span></span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                </label>
              </div>

              <button className="w-full bg-[#69ff87] hover:bg-[#52e87c] text-[#002108] font-bold py-4 rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] text-lg">
                Fund Escrow Now
              </button>
            </>
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
