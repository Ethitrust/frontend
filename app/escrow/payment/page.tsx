import { Building2, CreditCard, Smartphone } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

const methods = [
  { id: "chapa", label: "Chapa", sub: "Cards, bank, mobile money", icon: CreditCard, active: true },
  { id: "telebirr", label: "Telebirr", sub: "Direct wallet debit", icon: Smartphone, active: false },
  { id: "bank", label: "Bank transfer", sub: "STP reference in app", icon: Building2, active: false },
];

export default function EscrowPaymentPage() {
  return (
    <UserShell>
      <div className="mx-auto max-w-[520px]">
        <header className="mb-8">
          <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Escrow · Figma 2:3194</p>
          <h1 className="mt-1 flex items-center gap-2 font-heading text-3xl font-normal tracking-[-0.6px] text-[#001b44]">
            <CreditCard className="size-8 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
            Fund escrow
          </h1>
          <p className="mt-2 text-base text-[#434750]">Review the totals, choose a rail, and authorize the hold.</p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-[#e8eaf2] bg-white shadow-[0_12px_40px_rgba(19,27,46,0.06)]">
          <div className="border-b border-[#f2f3ff] px-6 py-6">
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Escrow reference</p>
            <p className="mt-1 font-mono text-lg font-semibold text-[#001b44]">ETH-2023-8841</p>
          </div>

          <div className="divide-y divide-[#f2f3ff] px-6">
            <div className="flex items-center justify-between py-4 text-sm">
              <span className="text-[#434750]">Goods / service</span>
              <span className="max-w-[55%] text-right font-medium text-[#001b44]">Green coffee — 2 tons</span>
            </div>
            <div className="flex items-center justify-between py-4 text-sm">
              <span className="text-[#434750]">Escrow amount</span>
              <span className="font-semibold text-[#001b44]">42,500.00 ETB</span>
            </div>
            <div className="flex items-center justify-between py-4 text-sm">
              <span className="text-[#434750]">EthiTrust fee (1%)</span>
              <span className="font-semibold text-[#001b44]">425.00 ETB</span>
            </div>
            <div className="flex items-center justify-between py-4 text-sm">
              <span className="font-semibold text-[#001b44]">Total due today</span>
              <span className="font-heading text-xl font-normal text-[#002f6c]">42,925.00 ETB</span>
            </div>
          </div>

          <div className="border-t border-[#f2f3ff] px-6 py-6">
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Pay with</p>
            <ul className="mt-3 space-y-2">
              {methods.map((m) => {
                const Icon = m.icon;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors ${
                        m.active ? "border-[#002f6c] bg-[#f2f3ff]" : "border-[#e8eaf2] bg-[#faf8ff]/50 hover:border-[#dae2fd]"
                      }`}
                    >
                      <span className={`flex size-10 items-center justify-center rounded-xl ${m.active ? "bg-[#002f6c] text-white" : "bg-[#e2e8f0] text-[#434750]"}`}>
                        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-[#001b44]">{m.label}</span>
                        <span className="block text-xs text-[#434750]">{m.sub}</span>
                      </span>
                      {m.active ? (
                        <span className="rounded-full bg-[#69ff87]/30 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#00732c]">Selected</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-[#f2f3ff] px-6 pb-8 pt-2">
            <button
              type="button"
              className="w-full rounded-xl bg-[#69ff87] py-4 text-sm font-bold text-[#002108] shadow-[0_12px_30px_rgba(105,255,135,0.35)]"
            >
              Pay 42,925.00 ETB with Chapa
            </button>
            <Link href="/escrow/tx-1" className="mt-4 block text-center text-sm font-semibold text-[#002f6c] underline-offset-2 hover:underline">
              Skip to transaction detail (dev)
            </Link>
          </div>
        </div>
      </div>
    </UserShell>
  );
}
