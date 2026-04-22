import { AlertTriangle, Banknote, CheckCircle2, MoreVertical, RefreshCw } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

type StatIcon = typeof RefreshCw;

type StatCard =
  | {
      label: string;
      value: string;
      dark: false;
      Icon: StatIcon;
      iconClass: string;
    }
  | {
      label: string;
      valueLines: readonly [string, string];
      dark: true;
      Icon: StatIcon;
      iconClass: string;
    };

const statCards: StatCard[] = [
  {
    label: "Active Escrows",
    value: "12",
    dark: false,
    Icon: RefreshCw,
    iconClass: "text-[#002f6c]",
  },
  {
    label: "Completed",
    value: "45",
    dark: false,
    Icon: CheckCircle2,
    iconClass: "text-[#00732c]",
  },
  {
    label: "Pending Disputes",
    value: "01",
    dark: false,
    Icon: AlertTriangle,
    iconClass: "text-[#ba1a1a]",
  },
  {
    label: "Wallet Balance",
    valueLines: ["125,400.00", "ETB"],
    dark: true,
    Icon: Banknote,
    iconClass: "text-[#69ff87]",
  },
];

const rows = [
  { date: "Oct 24, 2023", line1: "Alem Coffee", line2: "Exporters", amount: "42,500.00", status: "IN ESCROW" as const },
  { date: "Oct 24, 2023", line1: "Alem Coffee", line2: "Exporters", amount: "42,500.00", status: "COMPLETED" as const },
  { date: "Oct 24, 2023", line1: "Alem Coffee", line2: "Exporters", amount: "42,500.00", status: "UNDER REVIEW" as const },
  { date: "Oct 24, 2023", line1: "Alem Coffee", line2: "Exporters", amount: "42,500.00", status: "COMPLETED" as const },
];

function statusPill(status: (typeof rows)[number]["status"]) {
  if (status === "IN ESCROW") {
    return (
      <span className="inline-flex rounded-full bg-[rgba(92,253,128,0.3)] px-3 py-1 text-[11px] font-normal uppercase tracking-[-0.275px] text-[#00732c]">
        In Escrow
      </span>
    );
  }
  if (status === "UNDER REVIEW") {
    return (
      <span className="inline-flex min-h-[36px] min-w-[81px] items-center justify-center rounded-full bg-[rgba(255,218,214,0.3)] px-2 py-1 text-center text-[11px] font-normal uppercase leading-tight tracking-[-0.275px] text-[#ba1a1a]">
        Under
        <br />
        Review
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-[rgba(216,226,255,0.3)] px-3 py-1 text-[11px] font-normal uppercase tracking-[-0.275px] text-[#002f6c]">
      Completed
    </span>
  );
}

export default function UserDashboardPage() {
  return (
    <UserShell fab>
      <div className="flex w-full flex-col gap-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-normal tracking-[-0.9px] text-[#001b44]">Overview</h1>
            <p className="mt-1 text-base text-[#434750]">Welcome back</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const { Icon } = card;
            return (
              <article
                key={card.label}
                className={`flex min-h-[152px] flex-col justify-between rounded-3xl p-6 ${
                  card.dark ? "bg-[#002f6c] text-white" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-xs font-normal uppercase tracking-[1.2px] ${
                      card.dark ? "text-[#7999dc]" : "text-[#434750]"
                    }`}
                  >
                    {card.label}
                  </p>
                  <Icon className={`size-[22px] shrink-0 ${card.iconClass}`} strokeWidth={1.75} />
                </div>
                <div className="pt-4">
                  {card.dark ? (
                    <div className="font-heading text-2xl font-normal tracking-[-0.6px] text-white">
                      <p className="leading-8">{card.valueLines[0]}</p>
                      <p className="leading-8">{card.valueLines[1]}</p>
                    </div>
                  ) : (
                    <p className="font-heading text-3xl font-normal leading-9 text-[#001b44]">{card.value}</p>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section className="mx-auto w-full max-w-[914px] overflow-hidden rounded-3xl bg-white">
          <header className="flex items-center justify-between border-b border-[#f2f3ff] px-6 py-6">
            <h2 className="font-heading text-lg font-normal text-[#001b44]">Recent Transactions</h2>
            <Link href="/wallet" className="text-sm font-normal text-[#002f6c]">
              View All History
            </Link>
          </header>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="flex bg-[#f2f3ff] pr-[72px] text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">
                <div className="w-[152px] shrink-0 px-6 pb-6 pt-6">Date</div>
                <div className="min-w-0 flex-1 px-6 pb-6 pt-6">Merchant/Seller</div>
                <div className="w-[130px] shrink-0 px-6 py-4 leading-4">
                  Amount
                  <br />
                  (ETB)
                </div>
                <div className="w-[140px] shrink-0 px-6 pb-6 pt-6">Status</div>
                <div className="w-[72px] shrink-0" aria-hidden />
              </div>

              {rows.map((row, index) => (
                <div
                  key={`${row.date}-${index}`}
                  className="flex items-center border-b border-[#f2f3ff] pr-[72px] last:border-b-0"
                >
                  <div className="flex w-[152px] shrink-0 items-center px-6 py-5 text-sm text-[#434750]">{row.date}</div>
                  <div className="min-w-0 flex-1 px-6 py-7">
                    <p className="text-base text-[#001b44]">{row.line1}</p>
                    <p className="text-base text-[#001b44]">{row.line2}</p>
                  </div>
                  <div className="flex w-[130px] shrink-0 items-center px-6 py-10 text-base text-[#131b2e]">{row.amount}</div>
                  <div className="flex w-[140px] shrink-0 items-center justify-start px-6 py-9">{statusPill(row.status)}</div>
                  <div className="flex h-[92px] w-[72px] shrink-0 items-center justify-center">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-[#64748b] hover:bg-[#f2f3ff]"
                      aria-label="Row actions"
                    >
                      <MoreVertical className="size-5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </UserShell>
  );
}
