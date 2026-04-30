"use client";

import { KeyRound, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Mock API call
    setTimeout(() => {
      if (code === "123456") {
        router.push("/admin/disputes");
      } else {
        setError("Invalid verification code. Please try again.");
        setLoading(false);
      }
    }, 1000);
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

          <form className="space-y-5 px-8 py-8" noValidate onSubmit={handleVerify}>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#001b44]">Verify your email</h1>
              <p className="mt-1 text-sm text-[#434750]">We sent a 6-digit code to your email. Enter it below to continue.</p>
            </div>

            <label className="block">
              <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Verification Code</span>
              <span className="relative mt-2 block">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" strokeWidth={1.75} aria-hidden />
                <input
                  className="w-full rounded-lg bg-[#dae2fd] py-3 pl-10 pr-4 text-center text-lg tracking-[0.5em] text-[#001b44] outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#002f6c]"
                  placeholder="000000"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
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
              disabled={loading || code.length !== 6}
              className="flex w-full items-center justify-center rounded-xl bg-[#002f6c] px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,47,108,0.25)] disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <p className="text-center text-sm text-[#434750]">
              Didn't receive a code?{" "}
              <button type="button" onClick={() => alert("Code resent!")} className="font-semibold text-[#002f6c] underline-offset-2 hover:underline">
                Resend code
              </button>
            </p>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[#434750]/70">© 2026 EthiTrust. The Digital Guardian.</p>
      </div>
    </div>
  );
}
