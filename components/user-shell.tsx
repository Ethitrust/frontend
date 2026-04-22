"use client";

import type { ComponentType } from "react";
import {
  Bell,
  CircleHelp,
  Gavel,
  HandCoins,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  UserRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const USER_NAV: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: (path: string) => boolean;
}[] = [
  { href: "/dashboard/user", label: "Dashboard", Icon: LayoutDashboard, isActive: (p) => p === "/dashboard/user" },
  { href: "/escrow/create", label: "Escrows", Icon: HandCoins, isActive: (p) => p.startsWith("/escrow") },
  { href: "/wallet", label: "Wallet", Icon: Wallet, isActive: (p) => p.startsWith("/wallet") },
  { href: "/disputes/case-1", label: "Disputes", Icon: Gavel, isActive: (p) => p.startsWith("/disputes") },
  { href: "/settings", label: "Settings", Icon: Settings, isActive: (p) => p.startsWith("/settings") },
];

type UserShellProps = {
  children: React.ReactNode;
  fab?: boolean;
};

export function UserShell({ children, fab = false }: UserShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#001b44]">
      <div className="flex min-h-screen">
        <aside className="flex w-72 shrink-0 flex-col justify-between bg-[#f8fafc] px-6 py-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div>
            <Link href="/" className="mb-12 block">
              <p className="text-2xl font-normal tracking-[-1.2px] text-[#001b44]">EthiTrust</p>
              <p className="mt-0.5 text-[10px] font-normal uppercase tracking-[1px] text-[#006e2a] opacity-80">
                The Digital Guardian
              </p>
            </Link>
            <nav className="flex flex-col gap-2">
              {USER_NAV.map((item) => {
                const active = item.isActive(pathname);
                const { Icon } = item;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 py-3 pl-4 pr-5 ${
                      active
                        ? "border-r-4 border-[#006e2a] bg-[rgba(226,232,240,0.5)] font-normal text-[#001b44]"
                        : "text-[#64748b]"
                    }`}
                  >
                    <Icon className="size-[22px] shrink-0" strokeWidth={1.75} />
                    <span className="font-heading text-sm tracking-[-0.35px]">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <Link
            href="/escrow/create"
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-[#002f6c] px-6 py-4 text-center text-sm font-normal text-white"
          >
            <Plus className="size-4 shrink-0" strokeWidth={2.25} />
            Create New Escrow
          </Link>
        </aside>

        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-6 bg-[rgba(255,255,255,0.6)] px-8 backdrop-blur-[10px]">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search</span>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]"
                strokeWidth={1.75}
              />
              <input
                type="search"
                placeholder="Search transactions, sellers, or IDs..."
                className="w-full rounded-lg bg-[#dae2fd] py-2.5 pl-10 pr-3 text-sm text-[#001b44] outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#002f6c]"
              />
            </label>
            <div className="flex shrink-0 items-center gap-6">
              <button type="button" className="rounded-full p-2 text-[#434750] hover:bg-[#e2e8f0]/80" aria-label="Notifications">
                <Bell className="size-5" strokeWidth={1.75} />
              </button>
              <button type="button" className="rounded-full p-2 text-[#434750] hover:bg-[#e2e8f0]/80" aria-label="Help">
                <CircleHelp className="size-5" strokeWidth={1.75} />
              </button>
              <div
                className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-[#c4c6d2] bg-[#e8ecf4] text-[#002f6c]"
                aria-hidden
              >
                <UserRound className="size-[18px]" strokeWidth={1.75} />
              </div>
            </div>
          </header>

          <main className="relative flex-1 px-6 pb-12 pt-10 sm:px-10">{children}</main>

          {fab ? (
            <Link
              href="/escrow/create"
              className="fixed bottom-8 right-8 z-30 flex size-14 items-center justify-center rounded-full bg-[#69ff87] text-[#002108] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
              aria-label="Create escrow"
            >
              <Plus className="size-7" strokeWidth={2.5} />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
