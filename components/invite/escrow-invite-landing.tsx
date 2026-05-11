"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Handshake,
  UserPlus,
  Mail,
  BadgeCheck,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PrecheckData = {
  escrow_id: string;
  escrow_title: string;
  amount: number;
  currency: string;
  invited_email: string;
  has_account: boolean;
  email_verified: boolean;
  kyc_verified: boolean;
  can_accept: boolean;
  suggested_next_step: "register" | "verify_email" | "complete_kyc" | "accept";
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: currency === "ETB" ? "ETB" : currency,
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace("ETB", "ETB ");
}

const STEP_CONFIG = {
  register: {
    icon: UserPlus,
    label: "Create your account",
    description: "Sign up with the email address you were invited with.",
  },
  verify_email: {
    icon: Mail,
    label: "Verify your email",
    description: "Click the verification link we sent to your inbox.",
  },
  complete_kyc: {
    icon: BadgeCheck,
    label: "Complete identity verification",
    description: "A quick KYC check to protect both parties.",
  },
  accept: {
    icon: Handshake,
    label: "Accept the escrow",
    description: "Review and accept. Funds are protected until delivery.",
  },
};

const ALL_STEPS = ["register", "verify_email", "complete_kyc", "accept"] as const;

export function EscrowInviteLanding({ escrowId }: { escrowId: string }) {
  const searchParams = useSearchParams();
  const [precheck, setPrecheck] = useState<PrecheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = searchParams.get("email") ?? undefined;
    const precheckUrl = `/api/invite/${encodeURIComponent(escrowId)}/precheck${email ? `?invitee_email=${encodeURIComponent(email)}` : ""}`;

    fetch(precheckUrl, { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) {
          const message =
            body && typeof body === "object" && "error" in body && typeof body.error === "string"
              ? body.error
              : "Could not load invitation details.";
          throw new Error(message);
        }
        return body;
      })
      .then((pc) => {
        setPrecheck(pc as PrecheckData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [escrowId, searchParams]);

  const nextStep = precheck?.suggested_next_step ?? "register";
  const nextStepIdx = ALL_STEPS.indexOf(nextStep);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your escrow invitation…</p>
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────────
  if (error || !precheck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Invitation unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? "This invitation could not be loaded."}</p>
          <Button asChild variant="outline" className="mt-6 rounded-full">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">Ethitrust</span>
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Secured Escrow
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* Left — deal details + steps */}
          <div className="space-y-8">
            {/* Invitation headline */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                You have been invited
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {precheck.escrow_title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-600/5">
                  <Lock className="mr-1 size-3" />
                  Funds protected
                </Badge>
              </div>
            </div>

            {/* Steps */}
            <div>
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Complete these steps to accept
              </h2>
              <ol className="space-y-3">
                {ALL_STEPS.map((step, idx) => {
                  const done = idx < nextStepIdx;
                  const active = idx === nextStepIdx;
                  const cfg = STEP_CONFIG[step];
                  const Icon = cfg.icon;

                  return (
                    <li
                      key={step}
                      className={cn(
                        "flex gap-4 rounded-xl border p-4 transition-colors",
                        done && "border-primary/20 bg-primary/5",
                        active && "border-primary/40 bg-primary/10 shadow-sm",
                        !done && !active && "border-border/60 bg-muted/20 opacity-60",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          done && "bg-primary text-primary-foreground",
                          active && "bg-primary text-primary-foreground",
                          !done && !active && "bg-muted text-muted-foreground",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="size-4" />
                        ) : active ? (
                          <Icon className="size-4" />
                        ) : (
                          <Circle className="size-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground")}>
                          {done ? <s className="opacity-60">{cfg.label}</s> : cfg.label}
                        </p>
                        {active && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{cfg.description}</p>
                        )}
                      </div>
                      {done && (
                        <CheckCircle2 className="size-4 shrink-0 text-primary self-center" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Why Ethitrust */}
            <div className="rounded-xl border border-border/50 bg-muted/30 p-5">
              <h3 className="mb-3 text-sm font-semibold">Why Ethitrust?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" />
                  Funds are held in escrow — released only when you confirm delivery
                </li>
                <li className="flex gap-2">
                  <Clock className="size-4 shrink-0 text-primary mt-0.5" />
                  Dispute resolution if something goes wrong
                </li>
                <li className="flex gap-2">
                  <BadgeCheck className="size-4 shrink-0 text-primary mt-0.5" />
                  Identity-verified participants only — no fraud
                </li>
              </ul>
            </div>
          </div>

          {/* Right — action card */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
              {/* Amount block */}
              <div className="border-b border-border bg-primary/5 px-6 py-5 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Escrow Amount
                </p>
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {formatCurrency(precheck.amount, precheck.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {precheck.currency} · protected until delivery confirmed
                </p>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Invited email */}
                <div className="rounded-lg bg-muted/50 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Invited email</p>
                  <p className="mt-0.5 font-mono text-sm text-foreground break-all">
                    {precheck.invited_email}
                  </p>
                </div>

                {/* Status row */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your status</span>
                  <span
                    className={cn(
                      "font-medium",
                      nextStep === "accept" ? "text-green-600" : "text-orange-500",
                    )}
                  >
                    {nextStep === "accept" ? "Ready to accept" : "Action required"}
                  </span>
                </div>

                {/* CTA buttons */}
                {nextStep === "register" && (
                  <div className="space-y-2 pt-2">
                    <Button asChild className="w-full rounded-full font-semibold" size="lg">
                      <Link href={`/signup?next=/invite/${escrowId}&email=${encodeURIComponent(precheck.invited_email)}`}>
                        <UserPlus className="size-4 mr-2" />
                        Create free account
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full rounded-full" size="lg">
                      <Link href={`/signin?next=/invite/${escrowId}`}>
                        Already have an account? Sign in
                      </Link>
                    </Button>
                  </div>
                )}

                {nextStep === "verify_email" && (
                  <div className="space-y-2 pt-2">
                    <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-3 text-sm text-orange-600">
                      Check your inbox for the verification email and click the link.
                    </div>
                    <Button asChild variant="outline" className="w-full rounded-full" size="lg">
                      <Link href={`/verify-email?next=/invite/${escrowId}`}>
                        <Mail className="size-4 mr-2" />
                        Resend verification
                      </Link>
                    </Button>
                  </div>
                )}

                {nextStep === "complete_kyc" && (
                  <div className="space-y-2 pt-2">
                    <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-3 text-sm text-orange-600">
                      Identity verification protects both you and the other party.
                    </div>
                    <Button asChild className="w-full rounded-full font-semibold" size="lg">
                      <Link href={`/kyc?next=/invite/${escrowId}`}>
                        <BadgeCheck className="size-4 mr-2" />
                        Complete KYC
                        <ArrowRight className="size-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}

                {nextStep === "accept" && (
                  <div className="space-y-2 pt-2">
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700">
                      You are fully verified and ready to accept this escrow.
                    </div>
                    <Button asChild className="w-full rounded-full font-semibold" size="lg">
                      <Link href={`/escrows/${escrowId}`}>
                        <Handshake className="size-4 mr-2" />
                        View &amp; Accept Escrow
                        <ArrowRight className="size-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}

                <p className="text-center text-xs text-muted-foreground pt-1">
                  🔒 Your funds are protected by Ethitrust until both parties confirm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
