"use client";

import { Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      await fetchApi("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.body?.detail || err?.body?.message || err?.message || "Failed to send reset link.";
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

          {!success ? (
            <form className="space-y-5 px-8 py-8" noValidate onSubmit={handleReset}>
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#001b44]">Forgot password?</h1>
                <p className="mt-1 text-sm text-[#434750]">Enter your email and we'll send you a reset link.</p>
              </div>

              <label className="block">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Email address</span>
                <span className="relative mt-2 block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" strokeWidth={1.75} aria-hidden />
                  <input
                    className="w-full rounded-lg bg-[#dae2fd] py-3 pl-10 pr-4 text-sm text-[#001b44] outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#002f6c]"
                    placeholder="name@example.com"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading || !email}
                className="flex w-full items-center justify-center rounded-xl bg-[#002f6c] px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,47,108,0.25)] disabled:opacity-70"
              >
                {loading ? "Sending link..." : "Send reset link"}
              </button>

              <div className="text-center">
                <Link href="/auth" className="text-sm font-semibold text-[#002f6c] underline-offset-2 hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6 px-8 py-10 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e8fce8] text-[#00732c]">
                <Mail className="size-8" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-[#001b44]">Check your email</h2>
                <p className="mt-2 text-sm text-[#434750]">
                  We've sent a password reset link to <br/><span className="font-medium text-[#001b44]">{email}</span>
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/auth"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-[#c4c6d2] bg-white px-4 py-3.5 text-sm font-semibold text-[#001b44] transition-colors hover:bg-[#f8fafc]"
                >
                  Return to login
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[#434750]/70">© 2026 EthiTrust. The Digital Guardian.</p>
      </div>
    </div>
  );
}
