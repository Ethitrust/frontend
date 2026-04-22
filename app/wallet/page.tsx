import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

const linkedAccounts = [
  { name: "Telebirr", detail: "Primary funding source", badge: "Default", balance: "48,200.00" },
  { name: "CBE Birr", detail: "Linked account", badge: null as string | null, balance: "12,000.00" },
];

const movements = [
  { date: "Oct 22, 2023", title: "Escrow release", sub: "Alem Coffee Exporters", amount: "15,000.00", dir: "in" as const, status: "Completed" },
  { date: "Oct 20, 2023", title: "Deposit", sub: "Chapa · wallet top-up", amount: "42,500.00", dir: "in" as const, status: "Settled" },
  { date: "Oct 18, 2023", title: "Escrow hold", sub: "Freelance UI engagement", amount: "8,750.00", dir: "out" as const, status: "In escrow" },
  { date: "Oct 12, 2023", title: "Withdrawal", sub: "CBE Birr", amount: "5,000.00", dir: "out" as const, status: "Completed" },
];

function statusPill(label: string) {
  const u = label.toUpperCase();
  if (u.includes("ESCROW")) {
    return (
      <span className="inline-flex rounded-full bg-[rgba(92,253,128,0.3)] px-3 py-1 text-[11px] font-normal uppercase tracking-[-0.275px] text-[#00732c]">
        {label}
      </span>
    );
  }
  if (u.includes("SETTLED") || u === "COMPLETED") {
    return (
      <span className="inline-flex rounded-full bg-[rgba(216,226,255,0.45)] px-3 py-1 text-[11px] font-normal uppercase tracking-[-0.275px] text-[#002f6c]">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-[rgba(216,226,255,0.45)] px-3 py-1 text-[11px] font-normal uppercase tracking-[-0.275px] text-[#002f6c]">
      {label}
    </span>
  );
}

export default function WalletPage() {
  return (
    <UserShell>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-12 items-center justify-center rounded-2xl bg-[#d8e2ff] text-[#002f6c]">
            <Wallet className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Wallet · Figma 2:2</p>
            <h1 className="font-heading text-4xl font-normal tracking-[-0.9px] text-[#001b44]">ETB Wallet</h1>
            <p className="mt-1 text-base text-[#434750]">Available balance, linked rails, and ledger</p>
          </div>
        </div>
        <Link
          href="/escrow/payment"
          className="inline-flex items-center gap-2 rounded-xl bg-[#002f6c] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,47,108,0.2)]"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          Add funds
        </Link>
      </header>

      <div className="mb-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="flex min-h-[200px] flex-col justify-between rounded-3xl bg-[#002f6c] p-8 text-white shadow-[0_25px_50px_-12px_rgba(0,27,68,0.35)]">
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#7999dc]">Total available</p>
            <p className="mt-3 font-heading text-4xl font-normal tracking-[-1px]">125,400.00</p>
            <p className="mt-1 text-sm text-white/80">ETB</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/escrow/create"
              className="inline-flex items-center justify-center rounded-xl bg-[#69ff87] px-5 py-3 text-sm font-semibold text-[#002108]"
            >
              New escrow
            </Link>
            <Link
              href="/escrow/tx-1"
              className="inline-flex items-center justify-center rounded-xl border border-white/35 px-5 py-3 text-sm font-semibold text-white"
            >
              Latest transaction
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-[#e8eaf2] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-heading text-lg font-normal text-[#001b44]">
            <Landmark className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
            Linked accounts
          </h2>
          <ul className="mt-5 space-y-3">
            {linkedAccounts.map((a) => (
              <li
                key={a.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#f2f3ff] bg-[#faf8ff]/50 px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#001b44]">{a.name}</p>
                  <p className="text-sm text-[#434750]">{a.detail}</p>
                  {a.badge ? (
                    <span className="mt-2 inline-block rounded-md bg-[#d8e2ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#002f6c]">
                      {a.badge}
                    </span>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-[#131b2e]">{a.balance} ETB</p>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-[#f2f3ff] px-6 py-6">
          <h2 className="font-heading text-lg font-normal text-[#001b44]">Recent movements</h2>
          <Link href="/dashboard/user" className="text-sm font-medium text-[#002f6c]">
            Back to overview
          </Link>
        </header>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="flex bg-[#f2f3ff] text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">
              <div className="w-[140px] shrink-0 px-6 py-5">Date</div>
              <div className="min-w-0 flex-1 px-6 py-5">Description</div>
              <div className="w-[120px] shrink-0 px-6 py-5 text-right">Amount (ETB)</div>
              <div className="w-[140px] shrink-0 px-6 py-5">Status</div>
            </div>
            {movements.map((row) => (
              <div key={`${row.date}-${row.title}`} className="flex items-center border-b border-[#f2f3ff] last:border-b-0">
                <div className="flex w-[140px] shrink-0 items-center px-6 py-5 text-sm text-[#434750]">{row.date}</div>
                <div className="flex min-w-0 flex-1 items-start gap-3 px-6 py-6">
                  <span
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                      row.dir === "in" ? "bg-[rgba(92,253,128,0.25)] text-[#00732c]" : "bg-[#d8e2ff] text-[#002f6c]"
                    }`}
                  >
                    {row.dir === "in" ? (
                      <ArrowDownLeft className="size-4" strokeWidth={2} aria-hidden />
                    ) : (
                      <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-[#001b44]">{row.title}</p>
                    <p className="text-sm text-[#434750]">{row.sub}</p>
                  </div>
                </div>
                <div
                  className={`flex w-[120px] shrink-0 justify-end px-6 py-6 text-sm font-semibold tabular-nums ${
                    row.dir === "in" ? "text-[#00732c]" : "text-[#001b44]"
                  }`}
                >
                  {row.dir === "in" ? "+" : "−"}
                  {row.amount}
                </div>
                <div className="flex w-[140px] shrink-0 items-center px-6 py-6">{statusPill(row.status)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </UserShell>
  );
}
