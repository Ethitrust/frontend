"use client";

import type { ComponentType } from "react";
import {
  FlaskConical,
  Gavel,
  LayoutGrid,
  LogOut,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: (path: string) => boolean;
}[] = [
  { href: "/admin", label: "Overview", Icon: LayoutGrid, isActive: (p) => p === "/admin" },
  { href: "/admin/verification", label: "Verification", Icon: ShieldCheck, isActive: (p) => p.startsWith("/admin/verification") },
  { href: "/admin/users", label: "Users", Icon: Users, isActive: (p) => p.startsWith("/admin/users") },
  { href: "/admin/disputes", label: "Disputes", Icon: Gavel, isActive: (p) => p.startsWith("/admin/disputes") },
  { href: "/admin/audit", label: "Audit", Icon: ScrollText, isActive: (p) => p.startsWith("/admin/audit") },
  { href: "/admin/forensics", label: "Forensics", Icon: FlaskConical, isActive: (p) => p.startsWith("/admin/forensics") },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-800 bg-[#0c1222] p-6">
          <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-white">
            <ShieldCheck className="size-6 text-[#69ff87]" strokeWidth={1.75} />
            EthiTrust <span className="text-xs font-normal text-[#69ff87]">Admin</span>
          </Link>
          <nav className="space-y-1 text-sm">
            {ADMIN_NAV.map((item) => {
              const active = item.isActive(pathname);
              const { Icon } = item;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                    active ? "bg-[#1e293b] font-semibold text-[#69ff87]" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="size-4 shrink-0 opacity-90" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/dashboard/user"
            className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-center text-sm text-slate-300 hover:border-slate-500 hover:text-white"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
            Exit to user app
          </Link>
        </aside>
        <main className="p-6 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
