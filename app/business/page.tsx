import { BarChart3, Briefcase, Building2, Code2 } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

const team = [
  { name: "Mekdes Mesfin", role: "Treasury", email: "mekdes@acme.et", status: "Active" },
  { name: "Yonas Bekele", role: "Approver", email: "yonas@acme.et", status: "Active" },
  { name: "Helina T.", role: "Analyst", email: "helina@acme.et", status: "Invite sent" },
];

export default function BusinessDashboardPage() {
  return (
    <UserShell>
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-12 items-center justify-center rounded-2xl bg-[#d0e4ff] text-[#002f6c]">
            <Building2 className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Business · Figma 2:759</p>
            <h1 className="font-heading text-4xl font-normal tracking-[-0.9px] text-[#001b44]">Business dashboard</h1>
            <p className="mt-1 text-base text-[#434750]">Team roles, treasury, and B2B escrow volume.</p>
          </div>
        </div>
        <Link href="/verify/kyb" className="rounded-xl border border-[#002f6c] bg-white px-5 py-3 text-sm font-semibold text-[#002f6c]">
          KYB status
        </Link>
      </header>

      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        <article className="rounded-3xl border border-[#e8eaf2] bg-white p-6 shadow-sm">
          <BarChart3 className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
          <p className="mt-4 text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Monthly volume</p>
          <p className="mt-2 font-heading text-3xl font-normal text-[#001b44]">1.2M ETB</p>
        </article>
        <article className="rounded-3xl border border-[#e8eaf2] bg-white p-6 shadow-sm">
          <Briefcase className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
          <p className="mt-4 text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Active contracts</p>
          <p className="mt-2 font-heading text-3xl font-normal text-[#001b44]">28</p>
        </article>
        <article className="rounded-3xl bg-[#002f6c] p-6 text-white shadow-[0_20px_40px_rgba(0,47,108,0.3)]">
          <Code2 className="size-5 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
          <p className="mt-4 text-xs font-normal uppercase tracking-[1.2px] text-[#7999dc]">API status</p>
          <p className="mt-2 font-heading text-2xl font-normal">Operational</p>
          <Link href="/developer" className="mt-4 inline-flex text-sm font-semibold text-[#69ff87] underline-offset-2 hover:underline">
            Developer console →
          </Link>
        </article>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[#e8eaf2] bg-white">
        <header className="flex items-center justify-between border-b border-[#f2f3ff] px-6 py-5">
          <h2 className="font-heading text-lg font-normal text-[#001b44]">Team &amp; roles</h2>
          <button type="button" className="text-sm font-semibold text-[#002f6c]">
            Invite member
          </button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-[#f2f3ff] text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">
              <tr>
                <th className="px-6 py-4 font-normal">Name</th>
                <th className="px-6 py-4 font-normal">Role</th>
                <th className="px-6 py-4 font-normal">Email</th>
                <th className="px-6 py-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f3ff]">
              {team.map((row) => (
                <tr key={row.email}>
                  <td className="px-6 py-4 font-medium text-[#001b44]">{row.name}</td>
                  <td className="px-6 py-4 text-[#434750]">{row.role}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[#002f6c]">{row.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-normal uppercase tracking-[-0.275px] ${
                        row.status === "Active"
                          ? "bg-[rgba(92,253,128,0.3)] text-[#00732c]"
                          : "bg-[rgba(216,226,255,0.45)] text-[#002f6c]"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </UserShell>
  );
}
