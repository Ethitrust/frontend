"use client";

import React, { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import * as adminApi from "@/lib/admin";
import { RefreshCw, Search } from "lucide-react";

type AuditLog = {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  details?: any;
  created_at?: string;
};

type EscrowHistoryItem = {
  id: string;
  from_state?: string;
  to_state?: string;
  changed_by?: string;
  changed_by_name?: string;
  created_at?: string;
  details?: any;
};

export default function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [escrowId, setEscrowId] = useState<string>("");
  const [escrowHistory, setEscrowHistory] = useState<EscrowHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getAuditLogs({ per_page: 50 });
      setAuditLogs(res?.items ?? res ?? []);
    } catch (err) {
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEscrowHistory = async (id: string) => {
    if (!id) return setEscrowHistory([]);
    setHistoryLoading(true);
    try {
      const res: any = await adminApi.getEscrowStateHistory(id);
      setEscrowHistory(res?.items ?? res ?? []);
    } catch (err) {
      setEscrowHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#0a2540]">Audit & Trace</h3>
            <p className="text-sm text-slate-500">View system audit logs and escrow state history for traceability.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAuditLogs} className="flex items-center gap-2 rounded-lg bg-white border px-3 py-2 text-sm">
              <RefreshCw className="size-4 text-slate-600" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white p-4 border">
              <div className="flex items-center gap-3 mb-4">
                <Search className="size-4 text-slate-400" />
                <input
                  placeholder="Filter by actor, action, or target..."
                  className="w-full text-sm py-2 px-3 rounded-md border border-slate-100"
                  onChange={(e) => {
                    const q = e.target.value.trim();
                    if (!q) return loadAuditLogs();
                    // naive client-side filter
                    setAuditLogs((prev) => prev.filter((l) => JSON.stringify(l).toLowerCase().includes(q.toLowerCase())));
                  }}
                />
              </div>

              <div className="space-y-3">
                {loading && <div className="text-sm text-slate-400">Loading audit logs…</div>}
                {!loading && auditLogs.length === 0 && <div className="text-sm text-slate-400">No audit entries found.</div>}

                {auditLogs.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg border border-slate-100 bg-white/40">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[#0a2540]">{a.action ?? "action"}</div>
                        <div className="text-xs text-slate-500">{a.actor_name ?? a.actor_id ?? "system"} • {a.target_type ?? "-"} {a.target_id ? `(${a.target_id})` : ""}</div>
                      </div>
                      <div className="text-xs text-slate-400">{a.created_at ? new Date(a.created_at).toLocaleString() : "-"}</div>
                    </div>
                    {a.details && (
                      <pre className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-md overflow-auto">{typeof a.details === 'string' ? a.details : JSON.stringify(a.details, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border">
              <h4 className="text-sm font-bold mb-3">Escrow State History</h4>
              <div className="flex gap-2 mb-4">
                <input value={escrowId} onChange={(e) => setEscrowId(e.target.value)} placeholder="Enter escrow id" className="flex-1 text-sm py-2 px-3 rounded-md border border-slate-100" />
                <button onClick={() => fetchEscrowHistory(escrowId)} className="px-4 py-2 rounded-md bg-[#1e3a8a] text-white text-sm">Fetch</button>
              </div>

              {historyLoading && <div className="text-sm text-slate-400">Loading history…</div>}
              {!historyLoading && escrowHistory.length === 0 && <div className="text-sm text-slate-400">No history for provided escrow id.</div>}

              <div className="space-y-2">
                {escrowHistory.map((h) => (
                  <div key={h.id} className="p-3 rounded-lg border border-slate-100 bg-white/40">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{h.from_state} → {h.to_state}</div>
                      <div className="text-xs text-slate-400">{h.created_at ? new Date(h.created_at).toLocaleString() : "-"}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">By: {h.changed_by_name ?? h.changed_by ?? 'system'}</div>
                    {h.details && (
                      <pre className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-md overflow-auto">{typeof h.details === 'string' ? h.details : JSON.stringify(h.details, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-4 border">
              <h5 className="text-xs font-bold text-slate-500 uppercase">Quick Filters</h5>
              <div className="mt-3 space-y-2">
                <button onClick={() => { adminApi.getAuditLogs({ per_page: 50, target_type: 'Escrow' }).then((r:any) => setAuditLogs(r?.items ?? r ?? [])); }} className="w-full text-left px-3 py-2 rounded-md border bg-white text-sm">Escrow-related</button>
                <button onClick={() => { adminApi.getAuditLogs({ per_page: 50, action: 'approve' }).then((r:any) => setAuditLogs(r?.items ?? r ?? [])); }} className="w-full text-left px-3 py-2 rounded-md border bg-white text-sm">Approvals</button>
                <button onClick={() => { adminApi.getAuditLogs({ per_page: 50, action: 'reject' }).then((r:any) => setAuditLogs(r?.items ?? r ?? [])); }} className="w-full text-left px-3 py-2 rounded-md border bg-white text-sm">Rejections</button>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border">
              <h5 className="text-xs font-bold text-slate-500 uppercase">About</h5>
              <p className="text-sm text-slate-400">Audit logs capture admin and system activity. Escrow history shows a temporal record of state transitions for a specific escrow transaction.</p>
            </div>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}
