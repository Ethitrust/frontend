import { AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

const signals = [
  { title: "Device cluster jump", detail: "New session in Addis Ababa vs. historical Harar cluster for this wallet." },
  { title: "Amount anomaly", detail: "Escrow size ~3.2× rolling median for this merchant category (90d)." },
  { title: "Beneficiary drift", detail: "Payout account changed within 10 minutes of funding confirmation." },
];

export default function FraudWarningPage() {
  return (
    <UserShell>
      <div className="overflow-hidden rounded-3xl border-2 border-[#ba1a1a] bg-[#ffdad6] text-[#410002] shadow-[0_20px_50px_rgba(186,26,26,0.15)]">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#410002]/10">
            <ShieldAlert className="size-9 text-[#ba1a1a]" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#410002]/90">AI fraud warning · Figma 2:300</p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Unusual pattern detected</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#410002]/90">
              Funding and release are paused while we verify device history, amount context, and payout consistency. Analysts have been notified.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin/forensics"
                className="inline-flex items-center justify-center rounded-xl bg-[#410002] px-5 py-3 text-sm font-semibold text-white shadow-lg"
              >
                Escalate to analyst
              </Link>
              <Link
                href="/escrow/tx-1"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[#410002] bg-transparent px-5 py-3 text-sm font-semibold text-[#410002]"
              >
                View transaction
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-normal text-[#001b44]">
          <AlertTriangle className="size-5 text-[#ba1a1a]" strokeWidth={1.75} aria-hidden />
          Signals
        </h2>
        <ul className="mt-6 space-y-4">
          {signals.map((s) => (
            <li key={s.title} className="rounded-2xl border border-[#f2f3ff] bg-[#faf8ff]/60 px-5 py-4">
              <p className="font-medium text-[#001b44]">{s.title}</p>
              <p className="mt-1 text-sm text-[#434750]">{s.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </UserShell>
  );
}
