"use client";

import { useEffect, useState } from "react";
import { ChevronRight, FileText, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import HeatmapViewer from "@/components/heatmap-viewer";
import * as adminApi from "@/lib/admin";

type QueueItem = {
  id: string;
  name: string;
  type: string;
  date: string;
  risk: "Low" | "Medium" | "High";
  displayId: string;
  legalName?: string;
  tin?: string;
  address?: string;
  phone?: string;
  established?: string;
  documents?: { label: string; url: string }[];
};

export default function AdminVerificationPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [filter, setFilter] = useState("All");
  const [notes, setNotes] = useState("");
  const [forensics, setForensics] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getVerificationQueue().then((q: any) => {
      if (!mounted) return;
      setQueue(q?.items ?? q ?? []);
      setSelected((q?.items?.[0] ?? q?.[0]) || null);
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let mounted = true;
    adminApi.getForensicReport(selected.id).then((r) => {
      if (!mounted) return;
      setForensics(r);
    }).catch(() => setForensics(null));
    return () => { mounted = false; };
  }, [selected]);

  const handleApprove = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await adminApi.approveVerification(selected.id, { notes });
      // remove from queue locally
      setQueue((qq) => qq.filter((x) => x.id !== selected.id));
      setSelected(null);
    } catch (e) {
      // ignore for now
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await adminApi.rejectVerification(selected.id, { notes });
      setQueue((qq) => qq.filter((x) => x.id !== selected.id));
      setSelected(null);
    } catch (e) {
      // ignore for now
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await adminApi.requestMoreInfo(selected.id, { notes });
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = queue.filter((q) => {
    if (filter === "All") return true;
    if (filter === "Users") return q.type === "Individual";
    return q.type === "Business";
  });

  return (
    <AdminShell>
      <div className="flex h-full gap-8 p-4">
        {/* Left/Middle: Pending Queue */}
        <aside className="w-[320px] shrink-0 flex flex-col h-[calc(100vh-8rem)]">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#1e3a8a]">Pending Queue</h3>
            <span className="rounded-full bg-[#1e3a8a] px-3 py-1 text-[10px] font-bold tracking-wider text-white">{queue.length} TOTAL</span>
          </div>

          <div className="mb-4 flex items-center gap-6 border-b border-slate-200">
            {["All", "Users", "Businesses"].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`pb-2 text-xs font-semibold transition-colors ${
                  filter === tab 
                    ? "border-b-2 border-[#1e3a8a] text-[#1e3a8a]" 
                    : "border-b-2 border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2 pb-8">
            {filtered.map((q) => {
              const active = selected?.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelected(q)}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    active 
                      ? "bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-blue-100 ring-1 ring-blue-500/20" 
                      : "bg-white/60 hover:bg-white hover:shadow-sm border border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {q.type === "Business" ? "KYB" : "KYC"} • {q.type}
                        </span>
                        <span
                          className={`inline-flex rounded text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                            q.risk === "Low"
                              ? "bg-green-100 text-green-700"
                              : q.risk === "High"
                              ? "bg-red-100 text-red-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {q.risk} RISK
                        </span>
                      </div>
                      <p className={`text-[15px] font-semibold ${active ? "text-[#1e3a8a]" : "text-slate-700"}`}>{q.name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[11px] font-medium text-slate-400">{q.date}</p>
                        <ChevronRight className={`size-4 ${active ? "text-blue-500" : "text-slate-300"}`} strokeWidth={active ? 2.5 : 2} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-sm text-slate-400 p-4">No pending verifications.</div>
            )}
          </div>
        </aside>

        {/* Right: Verification Details */}
        <section className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-slate-400">Select a verification from the queue.</div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                    <FileText className="size-4" strokeWidth={2.5} />
                    {selected.type === "Business" ? "Business Verification (KYB)" : "Individual Verification (KYC)"}
                  </div>
                  <h2 className="text-[32px] leading-tight font-bold text-[#0a2540]">{selected.name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-400 mb-1">ID: {selected.displayId}</div>
                  {selected.risk === "High" && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100/80 px-3 py-1 text-xs font-bold text-red-600 uppercase tracking-wide">
                      <span className="size-1.5 rounded-full bg-red-600"></span>
                      Urgent Review
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pb-24 pr-4">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
                  {/* Left Details Column */}
                  <div className="space-y-8">
                    {/* Legal Info */}
                    <div className="rounded-2xl bg-[#f8fbff] p-6 border border-blue-50/50">
                      <h4 className="text-xs font-bold tracking-widest text-[#1e3a8a] uppercase mb-6">Legal Information</h4>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Legal Name</div>
                          <div className="text-sm font-medium text-slate-700">{selected.legalName ?? selected.name}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">TIN / Registration</div>
                          <div className="text-sm font-medium text-slate-700">{selected.tin ?? "—"}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Address</div>
                          <div className="text-sm font-medium text-slate-700">{selected.address ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Phone</div>
                          <div className="text-sm font-medium text-slate-700">{selected.phone ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Established</div>
                          <div className="text-sm font-medium text-slate-700">{selected.established ?? "—"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Supporting Docs */}
                    <div>
                      <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">Supporting Documents</h4>
                      <div className="flex flex-wrap gap-4">
                        {(selected.documents ?? []).map((doc, i) => (
                          <div key={i} className="relative h-40 w-[120px] shrink-0 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100 group cursor-pointer">
                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity filter grayscale" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-2 left-2 right-2 text-center text-[8px] font-bold tracking-widest text-white uppercase">
                              {doc.label}
                            </div>
                          </div>
                        ))}
                        {(!selected.documents || selected.documents.length === 0) && (
                          <div className="text-sm text-slate-400">No documents provided.</div>
                        )}
                      </div>
                    </div>

                    {/* Forensic Report */}
                    <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Forensic Report</h4>
                      {forensics ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-[#0a2540]">ELA Heatmap</p>
                            {forensics.ela_heatmap_url || forensics.original_image_url ? (
                              <div className="mt-2">
                                <HeatmapViewer
                                  originalUrl={forensics.original_image_url ?? selected.documents?.[0]?.url}
                                  heatmapUrl={forensics.ela_heatmap_url}
                                  reasoningCards={forensics.reasoning_cards ?? []}
                                />
                              </div>
                            ) : (
                              <div className="mt-2 text-sm text-slate-400">No heatmap available.</div>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-[#0a2540]">Reasoning Cards</p>
                            <ul className="mt-2 space-y-2">
                              {(forensics.reasoning_cards ?? []).map((c: any, i: number) => (
                                <li key={i} className="rounded-xl border border-slate-100 p-3">
                                  <div className="text-sm font-medium text-[#0a2540]">{c.title}</div>
                                  <div className="text-xs text-slate-500 mt-1">{c.detail}</div>
                                </li>
                              ))}
                              {(forensics.reasoning_cards ?? []).length === 0 && (
                                <li className="text-sm text-slate-400">No reasoning cards produced.</li>
                              )}
                            </ul>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-[#0a2540]">Risk Score</p>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (forensics.risk_score ?? 0) * 100)}%` }}></div>
                              </div>
                              <div className="text-sm font-bold text-[#0a2540]">{Math.round((forensics.risk_score ?? 0) * 100)}%</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">Forensic analysis pending.</div>
                      )}
                    </div>
                  </div>

                  {/* Right Details Column (Sidebar) */}
                  <div className="space-y-6">
                    {/* AI Insights */}
                    <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-5">
                        <RefreshCw className="size-4 text-blue-500" strokeWidth={2.5} />
                        <h4 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">AI Insights</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-end justify-between mb-1.5">
                            <span className="text-[13px] font-bold text-[#0a2540]">Face Match</span>
                            <span className="text-[13px] font-bold text-emerald-600">{Math.round((forensics?.face_match ?? 0) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (forensics?.face_match ?? 0) * 100)}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-end justify-between mb-1.5">
                            <span className="text-[13px] font-bold text-[#0a2540]">Doc Authenticity</span>
                            <span className="text-[13px] font-bold text-emerald-600">{forensics?.doc_authenticity ?? 'Unknown'}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${forensics?.doc_auth_score ? Math.min(100, forensics.doc_auth_score*100) : 0}%` }}></div>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-end justify-between mb-1.5">
                            <span className="text-[13px] font-bold text-[#0a2540]">Entity Risk</span>
                            <span className="text-[13px] font-bold text-red-600">{forensics?.entity_risk ?? 'Unknown'}</span>
                          </div>
                          <p className="text-[10px] leading-snug text-red-600/80">{forensics?.entity_risk_reason ?? 'No alerts'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Review Notes */}
                    <div className="rounded-2xl bg-[#eef1f8] p-5">
                      <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Admin Review Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        className="w-full resize-none rounded-xl bg-transparent p-0 text-sm font-medium text-[#1e3a8a] placeholder:text-[#1e3a8a]/40 focus:ring-0 border-none outline-none"
                        placeholder="Enter detailed findings or reason for rejection..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="absolute bottom-8 right-8 flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/50 shadow-lg">
                <button onClick={handleRequestInfo} disabled={loading} className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-3.5 text-sm font-bold text-[#0a2540] hover:bg-slate-50 transition-colors shadow-sm">
                  <RefreshCw className="size-4" strokeWidth={2.5} />
                  Request More Info
                </button>
                <button onClick={handleReject} disabled={loading} className="rounded-xl bg-[#c52828] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#a62020] transition-colors shadow-sm shadow-red-500/20">
                  Reject Submission
                </button>
                <button onClick={handleApprove} disabled={loading} className="rounded-xl bg-[#61ff8d] px-8 py-3.5 text-sm font-bold text-[#064e20] hover:bg-[#52e87c] transition-colors shadow-sm shadow-emerald-500/20">
                  Approve Account
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
