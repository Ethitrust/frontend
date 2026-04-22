import { Download, Search, Users } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
          <Users className="size-8 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
          User management
        </h1>
        <p className="mt-1 text-sm text-slate-400">Search, roles, suspension, and audit trail · Figma 2:1584</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-[260px] flex-1">
          <span className="sr-only">Search users</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" strokeWidth={1.75} aria-hidden />
          <input
            type="search"
            placeholder="Search by email, phone, Fayda ID…"
            className="w-full rounded-xl border border-slate-600 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#69ff87]"
          />
        </label>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#69ff87] px-5 py-3 text-sm font-semibold text-[#0f172a]"
        >
          <Download className="size-4" strokeWidth={2} aria-hidden />
          Export CSV
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-dashed border-slate-600 bg-slate-900/20">
        <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-slate-500">
          User grid binds here — filters for role, KYC state, and last active.
        </div>
      </div>
    </AdminShell>
  );
}
