"use client";

import React, { useEffect, useState } from "react";
import { UserShell } from "@/components/user-shell";
import { fetchApi } from "@/lib/api";

type Session = {
  id: string;
  ip?: string;
  user_agent?: string;
  device?: string;
  last_active_at?: string;
  current?: boolean;
};

export default function SecurityPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingIds, setRevokingIds] = useState<Record<string, boolean>>({});
  const [globalRevoking, setGlobalRevoking] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchApi("/auth/sessions");
      setSessions(Array.isArray(data) ? data : data.sessions ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (id?: string) => {
    setError("");
    if (id) {
      setRevokingIds((s) => ({ ...s, [id]: true }));
      try {
        await fetchApi(`/auth/sessions/${id}`, { method: "DELETE" });
        setSessions((s) => s.filter((sess) => sess.id !== id));
      } catch (err) {
        console.error(err);
        setError("Failed to revoke session.");
      } finally {
        setRevokingIds((s) => ({ ...s, [id]: false }));
      }
    } else {
      setGlobalRevoking(true);
      try {
        await fetchApi("/auth/sessions", { method: "DELETE" });
        setSessions([]);
      } catch (err) {
        console.error(err);
        setError("Failed to revoke sessions.");
      } finally {
        setGlobalRevoking(false);
      }
    }
  };

  return (
    <UserShell>
      <div className="max-w-3xl">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-normal">Security & Sessions</h1>
          <p className="mt-1 text-sm text-[#434750]">Active sign-ins across devices and locations. Revoke access remotely.</p>
        </header>

        {error && <div className="rounded-lg border border-[#ffdad6] bg-[rgba(255,218,214,0.35)] px-4 py-3 text-sm text-[#ba1a1a]">{error}</div>}

        <div className="mb-4 flex items-center gap-3">
          <button className="rounded-xl bg-[#69ff87] px-4 py-2 text-[#002108] font-semibold" onClick={() => revoke()}>
            {globalRevoking ? "Signing out everywhere..." : "Sign out everywhere"}
          </button>
          <button className="rounded-xl bg-white border px-4 py-2 text-[#002f6c]" onClick={load}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div>Loading sessions...</div>
        ) : (
          <ul className="space-y-3">
            {sessions.length === 0 && <li className="text-sm text-[#64748b]">No active sessions found.</li>}
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                <div>
                  <div className="font-medium">
                    {s.device ?? s.user_agent ?? "Unknown device"} {s.current ? <span className="ml-2 text-sm font-semibold text-[#006e2a]">(This session)</span> : null}
                  </div>
                  <div className="text-sm text-[#64748b]">{s.ip ?? ""} • Last active {s.last_active_at ?? ""}</div>
                </div>
                <div>
                  <button disabled={Boolean(revokingIds[s.id])} className="rounded-md bg-[#002f6c] px-3 py-1 text-white text-sm" onClick={() => revoke(s.id)}>
                    {revokingIds[s.id] ? "Revoking..." : "Revoke"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </UserShell>
  );
}
