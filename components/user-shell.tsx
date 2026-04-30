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
                    className={`flex items-center gap-3 py-3 pl-4 pr-5 ${active
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
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-[#002f6c] px-6 py-4 text-center text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(0,47,108,0.2)]"
          >
            <Plus className="size-4 shrink-0" strokeWidth={2.25} />
            New Transaction
          </Link>
        </aside>

        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between gap-6 bg-[rgba(255,255,255,0.8)] px-8 backdrop-blur-[10px] border-b border-[#f1f5f9]">
            <label className="relative w-[320px] max-w-full">
              <span className="sr-only">Search</span>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#94a3b8]"
                strokeWidth={2}
              />
              <input
                type="search"
                placeholder="Search transactions..."
                className="w-full rounded-full border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-[13px] text-[#001b44] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#002f6c] focus:ring-1 focus:ring-[#002f6c] shadow-sm"
              />
            </label>
            <div className="flex shrink-0 items-center gap-5">
              <button type="button" className="text-[#64748b] transition-colors hover:text-[#001b44]" aria-label="Notifications">
                <Bell className="size-5" strokeWidth={2} />
              </button>
              <button type="button" className="text-[#64748b] transition-colors hover:text-[#001b44]" aria-label="History">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
              </button>
              <div className="h-6 w-px bg-[#e2e8f0]"></div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-[#001b44]">Abebe Kebede</span>
                <div
                  className="flex size-[34px] items-center justify-center overflow-hidden rounded-full border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]"
                  aria-hidden
                >
                  {/* Using a simple placeholder drawing representing a user avatar */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="size-full">
                    <rect width="100" height="100" fill="#f1f5f9" />
                    <circle cx="50" cy="40" r="18" fill="#e2e8f0" />
                    <path d="M50 65C30 65 15 80 15 100H85C85 80 70 65 50 65Z" fill="#e2e8f0" />
                    {/* Add a slightly more realistic look based on the image */}
                    <circle cx="50" cy="40" r="16" fill="#fcd3b6" />
                    <path d="M50 62C32 62 18 78 18 100H82C82 78 68 62 50 62Z" fill="#001b44" />
                  </svg>
                </div>
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
