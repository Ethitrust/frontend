"use client";

import { Lock, Mail, Shield, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.access_token) {
        localStorage.setItem("token", res.access_token);
        router.push("/admin/disputes"); // Route to the admin panel for testing purposes or user dashboard
      }
    } catch (err: any) {
      setError("Wrong email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const [first_name, ...rest] = name.trim().split(" ");
    const last_name = rest.join(" ") || "User";
    try {
      const res = await fetchApi("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, first_name, last_name }),
      });
      if (res.token?.access_token) {
        localStorage.setItem("token", res.token.access_token);
        router.push("/admin/disputes");
      }
    } catch (err: any) {
      setError("Failed to create account. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="overflow-hidden rounded-2xl border border-[rgba(196,198,210,0.15)] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]">
          {/* Brand strip — matches security-first Figma treatment (node 2:4180) */}
          <div className="bg-[#001b44] px-8 py-10 text-center text-white">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10">
              <Shield className="size-8 text-[#69ff87]" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="font-heading text-xl font-semibold tracking-[0.2em] text-white">ETHITRUST</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">Secure access to your escrow workspace</p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-[#f2f3ff] bg-[#faf8ff]/80">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`py-4 text-sm font-semibold transition-colors ${
                tab === "login"
                  ? "border-b-2 border-[#002f6c] text-[#001b44] bg-white"
                  : "text-[#64748b] hover:text-[#001b44]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`py-4 text-sm font-semibold transition-colors ${
                tab === "register"
                  ? "border-b-2 border-[#002f6c] text-[#001b44] bg-white"
                  : "text-[#64748b] hover:text-[#001b44]"
              }`}
            >
              Register
            </button>
          </div>

          {tab === "login" ? (
            <form className="space-y-5 px-8 py-8" noValidate onSubmit={handleLogin}>
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#001b44]">Welcome back</h1>
                <p className="mt-1 text-sm text-[#434750]">Sign in to manage escrows, wallet, and disputes.</p>
              </div>

              <label className="block">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Email or phone</span>
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

              <label className="block">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Password</span>
                <span className="relative mt-2 block">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" strokeWidth={1.75} aria-hidden />
                  <input
                    className="w-full rounded-lg bg-[#dae2fd] py-3 pl-10 pr-4 text-sm text-[#001b44] outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#002f6c]"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-[#002f6c] px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,47,108,0.25)] disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login to EthiTrust"}
              </button>

              <p className="text-center text-sm text-[#434750]">
                New here?{" "}
                <button type="button" onClick={() => setTab("register")} className="font-semibold text-[#002f6c] underline-offset-2 hover:underline">
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form className="space-y-5 px-8 py-8" noValidate onSubmit={handleSignup}>
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#001b44]">Create your account</h1>
                <p className="mt-1 text-sm text-[#434750]">Individual or business — you can upgrade to KYB later.</p>
              </div>

              <label className="block">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Full name</span>
                <span className="relative mt-2 block">
                  <UserPlus className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" strokeWidth={1.75} aria-hidden />
                  <input
                    className="w-full rounded-lg bg-[#dae2fd] py-3 pl-10 pr-4 text-sm text-[#001b44] outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#002f6c]"
                    placeholder="Selam Tadesse"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Email</span>
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

              <label className="block">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Password</span>
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

              {error && (
                <div className="rounded-lg border border-[#ffdad6] bg-[rgba(255,218,214,0.35)] px-4 py-3 text-sm text-[#ba1a1a]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#69ff87] px-4 py-3.5 text-sm font-bold text-[#002108] shadow-[0_10px_24px_rgba(105,255,135,0.25)] disabled:opacity-70"
              >
                {loading ? "Creating..." : "Continue"}
              </button>

              <p className="text-center text-sm text-[#434750]">
                Already registered?{" "}
                <button type="button" onClick={() => setTab("login")} className="font-semibold text-[#002f6c] underline-offset-2 hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[#434750]/70">© 2026 EthiTrust. The Digital Guardian.</p>
      </div>
    </div>
  );
}
