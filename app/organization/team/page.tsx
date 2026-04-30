"use client";

import { useState } from "react";
import { Building2, Mail, Plus, Shield, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

type TeamMember = {
  name: string;
  role: string;
  email: string;
  status: "Active" | "Invite sent";
};

const initialTeam: TeamMember[] = [
  { name: "Mekdes Mesfin", role: "Treasury", email: "mekdes@acme.et", status: "Active" },
  { name: "Yonas Bekele", role: "Approver", email: "yonas@acme.et", status: "Active" },
  { name: "Helina T.", role: "Analyst", email: "helina@acme.et", status: "Invite sent" },
];

export default function TeamManagementPage() {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Analyst");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setTeam([
      ...team,
      {
        name: "Pending...",
        role: inviteRole,
        email: inviteEmail,
        status: "Invite sent",
      }
    ]);
    
    setInviteEmail("");
    setIsInviting(false);
  };

  const handleRemove = (email: string) => {
    setTeam(team.filter(m => m.email !== email));
  };

  return (
    <UserShell>
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-12 items-center justify-center rounded-2xl bg-[#d0e4ff] text-[#002f6c]">
            <Building2 className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="font-heading text-4xl font-normal tracking-[-0.9px] text-[#001b44]">Team Management</h1>
            <p className="mt-1 text-base text-[#434750]">Invite members, assign roles, and manage access.</p>
          </div>
        </div>
        <Link href="/business" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Back to Business
        </Link>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: Team List */}
        <section className="overflow-hidden rounded-3xl border border-[#e8eaf2] bg-white">
          <header className="flex items-center justify-between border-b border-[#f2f3ff] px-6 py-5">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-[#002f6c]" />
              <h2 className="font-heading text-lg font-normal text-[#001b44]">Organization Members</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{team.length} Members</span>
          </header>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#f2f3ff] text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">
                <tr>
                  <th className="px-6 py-4 font-normal">Name</th>
                  <th className="px-6 py-4 font-normal">Role</th>
                  <th className="px-6 py-4 font-normal">Email</th>
                  <th className="px-6 py-4 font-normal">Status</th>
                  <th className="px-6 py-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f3ff]">
                {team.map((row) => (
                  <tr key={row.email} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#001b44]">{row.name}</td>
                    <td className="px-6 py-4 text-[#434750]">{row.role}</td>
                    <td className="px-6 py-4 font-mono text-xs text-[#002f6c]">{row.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          row.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRemove(row.email)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {team.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No team members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Invite Form / Info */}
        <aside className="space-y-6">
          <section className="rounded-3xl border border-[#e8eaf2] bg-[#f8fafc] p-6">
            <h2 className="font-heading text-lg font-normal text-[#001b44] mb-4">Invite New Member</h2>
            
            {isInviting ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#001b44] mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@acme.et" 
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#c4c6d2] text-sm focus:border-[#002f6c] focus:ring-1 focus:ring-[#002f6c] outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#001b44] mb-1">Role</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c6d2] text-sm focus:border-[#002f6c] focus:ring-1 focus:ring-[#002f6c] outline-none bg-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Treasury">Treasury</option>
                    <option value="Approver">Approver</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsInviting(false)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 rounded-xl bg-[#002f6c] py-2.5 text-sm font-bold text-white hover:bg-[#001b44]"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsInviting(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#69ff87] px-5 py-3 text-sm font-bold text-[#002108] transition-all hover:bg-[#52e87c] shadow-sm"
              >
                <Plus className="size-5" strokeWidth={2.5} />
                Add Team Member
              </button>
            )}
          </section>

          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 text-sm">Role Permissions</h3>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  <strong>Treasury:</strong> Can fund escrows and withdraw payouts.<br/>
                  <strong>Approver:</strong> Can approve delivery and release funds.<br/>
                  <strong>Analyst:</strong> Read-only access to transactions and disputes.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </UserShell>
  );
}
