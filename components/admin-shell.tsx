"use client";

import type { ComponentType } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  FlaskConical,
  History,
  Moon,
  Search,
  Settings,
  HelpCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_NAV: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: (path: string) => boolean;
}[] = [
  { href: "/admin/verification", label: "Queue", Icon: ClipboardList, isActive: (p) => p.startsWith("/admin/verification") || p === "/admin" },
  { href: "/admin/analytics", label: "Analytics", Icon: BarChart3, isActive: (p) => p.startsWith("/admin/analytics") },
  { href: "/admin/forensics", label: "Forensic Tools", Icon: FlaskConical, isActive: (p) => p.startsWith("/admin/forensics") },
  { href: "/admin/users", label: "User Management", Icon: Users, isActive: (p) => p.startsWith("/admin/users") },
  { href: "/admin/audit", label: "Audit & Trace", Icon: History, isActive: (p) => p.startsWith("/admin/audit") },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#f4f7fa] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo area */}
        <div className="p-6 pb-8">
          <h1 className="text-[19px] font-semibold text-[#1e3a8a] leading-tight">Digital Guardian</h1>
          <p className="text-[10px] font-medium tracking-wider text-slate-400 mt-1 uppercase">Verification Authority</p>
        </div>
        
        {/* Nav links */}
        <nav className="flex-1 px-4 space-y-1">
          {MAIN_NAV.map((item) => {
            const active = item.isActive(pathname);
            const { Icon } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                  active 
                    ? "bg-blue-50/50 text-[#1e3a8a] font-semibold border-l-4 border-[#1e3a8a]" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-l-4 border-transparent"
                }`}
              >
                <Icon className={`size-4.5 ${active ? "text-[#1e3a8a]" : "text-slate-400"}`} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer items */}
        <div className="p-6 space-y-4">
          <button className="w-full bg-[#0a2540] hover:bg-[#0a2540]/90 transition-colors text-white text-[11px] font-bold tracking-wider py-3 rounded-md flex items-center justify-center uppercase shadow-sm">
            System Status
          </button>
          <div className="space-y-1 pt-2">
            <Link href="/admin/settings" className="flex items-center gap-3 px-2 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <Settings className="size-4.5 text-slate-400" strokeWidth={2} />
              Settings
            </Link>
            <Link href="/admin/support" className="flex items-center gap-3 px-2 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <HelpCircle className="size-4.5 text-slate-400" strokeWidth={2} />
              Support
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-8">
            <h2 className="text-[#1e3a8a] font-bold text-lg tracking-tight">Admin Console</h2>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Search verifications..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-full text-sm w-[300px] outline-none transition-all placeholder:text-slate-400" 
              />
            </div>
          </div>
          <div className="flex items-center gap-5 text-slate-400">
            <button className="hover:text-slate-600 transition-colors relative">
              <Bell className="size-5" strokeWidth={2} />
              <span className="absolute top-0 right-0 size-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="hover:text-slate-600 transition-colors">
              <History className="size-5" strokeWidth={2} />
            </button>
            <button className="hover:text-slate-600 transition-colors">
              <Moon className="size-5" strokeWidth={2} />
            </button>
            <div className="size-8 rounded-full bg-teal-500 shadow-sm overflow-hidden ml-2 flex items-center justify-center text-white font-semibold text-xs border border-teal-600">
               MK
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
