"use client";

import { Lock, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    const token = searchParams.get('token') || searchParams.get('t');
    if (!token) {
      setError("Invalid or expired reset link.");
      return;
    }

    setLoading(true);
    try {
      await fetchApi('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      alert('Password successfully reset! Please login with your new password.');
      router.push('/auth');
    } catch (err: any) {
      const msg = err?.body?.detail || err?.body?.message || err?.message || 'Failed to reset password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="overflow-hidden rounded-2xl border border-[rgba(196,198,210,0.15)] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]">
          {/* Brand strip */}
          <div className="bg-[#001b44] px-8 py-10 text-center text-white">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10">
              <Shield className="size-8 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="font-heading text-xl font-semibold tracking-[0.2em] text-white">ETHITRUST</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">Secure access to your escrow workspace</p>
          </div>

          <form className="space-y-5 px-8 py-8" noValidate onSubmit={handleReset}>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#001b44]">Reset your password</h1>
              <p className="mt-1 text-sm text-[#434750]">Please enter your new password below.</p>
            </div>

            <label className="block">
              <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">New Password</span>
              <span className="relative mt-2 block">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" strokeWidth={1.75} aria-hidden />
                <input
                  className="w-full rounded-lg bg-[#dae2fd] py-3 pl-10 pr-4 text-sm text-[#001b44] outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#002f6c]"
                  placeholder="At least 8 characters"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Confirm New Password</span>
              <span className="relative mt-2 block">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" strokeWidth={1.75} aria-hidden />
                <input
                  className="w-full rounded-lg bg-[#dae2fd] py-3 pl-10 pr-4 text-sm text-[#001b44] outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#002f6c]"
                  placeholder="Re-enter your new password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </span>
            </label>

            {error && (
              <div className="rounded-lg border border-[#ffdad6] bg-[rgba(255,218,214,0.35)] px-4 py-3 text-sm text-[#ba1a1a]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="flex w-full items-center justify-center rounded-xl bg-[#69ff87] px-4 py-3.5 text-center text-sm font-bold text-[#002108] shadow-[0_10px_24px_rgba(105,255,135,0.25)] disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>

            <div className="text-center">
              <Link href="/auth" className="text-sm font-semibold text-[#002f6c] underline-offset-2 hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[#434750]/70">© 2026 EthiTrust. The Digital Guardian.</p>
      </div>
    </div>
  );
}
