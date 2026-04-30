"use client";

import React, { useEffect, useState } from "react";
import { UserShell } from "@/components/user-shell";
import { fetchApi } from "@/lib/api";

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchApi("/auth/me");
        if (!mounted) return;
        setFirstName(data.first_name ?? data.firstName ?? "");
        setLastName(data.last_name ?? data.lastName ?? "");
        setEmail(data.email ?? "");
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const payload = { first_name: firstName, last_name: lastName };
      await fetchApi("/auth/me", { method: "PUT", body: JSON.stringify(payload) });
      setMessage("Profile updated");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserShell>
      <div>
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-normal">Profile</h1>
          <p className="mt-1 text-sm text-[#434750]">Update your name and contact details.</p>
        </header>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <label className="block">
              <span className="text-xs text-[#434750]">First name</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[#434750]">Last name</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[#434750]">Email</span>
              <input value={email} readOnly className="mt-2 w-full rounded-lg border px-3 py-2 bg-[#f3f4f6]" />
            </label>

            {message && <div className="text-sm text-[#001b44]">{message}</div>}

            <div>
              <button type="submit" disabled={saving} className="rounded-xl bg-[#002f6c] px-4 py-2 text-white">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </UserShell>
  );
}
