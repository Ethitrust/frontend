"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gavel,
  Handshake,
  Landmark,
  Mail,
  Scale,
  Shield,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuthMe } from "@/lib/auth/me-session-api";
import { fetchMeDisputes } from "@/lib/disputes/me-disputes-api";
import type { EscrowDisputeRow } from "@/lib/disputes/dispute-types";
import { escrowPartyForViewer } from "@/lib/escrows/escrow-party";
import {
  fetchMeEscrow,
  fetchMeEscrowMilestones,
  postMeEscrowAction,
  postMeMilestoneAction,
  type EscrowAction,
} from "@/lib/escrows/me-escrows-api";
import type { EscrowRow, MilestoneRow } from "@/lib/escrows/escrow-list-types";
import {
  formatEscrowDate,
  formatEscrowDateTime,
  formatEscrowMoney,
} from "@/lib/escrows/format-escrow";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

// ─── Lifecycle helpers ────────────────────────────────────────────────────────

const LIFECYCLE_STEPS = [
  { key: "invited", label: "Invited" },
  { key: "pending_funding", label: "Awaiting Funds" },
  { key: "active", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const TERMINAL_STATUSES = ["cancelled", "rejected", "disputed"];

function getLifecycleIndex(status: string): number {
  return LIFECYCLE_STEPS.findIndex((s) => s.key === status);
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadgeVariant(status: string) {
  if (status === "active") return "secondary" as const;
  if (status === "completed") return "outline" as const;
  if (status === "invited") return "outline" as const;
  if (status === "pending_funding") return "default" as const;
  return "outline" as const;
}

function milestoneProgress(milestones: MilestoneRow[], currency: string) {
  const total = milestones.reduce((s, m) => s + m.amount, 0);
  const done = milestones
    .filter((m) => m.status === "completed")
    .reduce((s, m) => s + m.amount, 0);
  if (total <= 0) return { pct: 0, done, total };
  return { pct: Math.round((done / total) * 100), done, total };
}

function disputeNeedsAttention(row: EscrowDisputeRow) {
  const s = (row.status ?? "").toLowerCase();
  if (!s) return false;
  return !/resolved|closed|cancel|canceled|settled|completed/.test(s);
}

function escrowTypeLabel(type: string): string {
  const map: Record<string, string> = {
    one_time: "One-time",
    milestone: "Milestone",
    recurring: "Recurring",
  };
  return (
    map[type] ??
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function viewerRoleLabel(
  party: "initiator" | "receiver" | "unknown",
  initiatorRole: string,
): "Buyer" | "Seller" | null {
  if (party === "unknown") return null;
  if (party === "initiator")
    return initiatorRole === "buyer" ? "Buyer" : "Seller";
  return initiatorRole === "buyer" ? "Seller" : "Buyer";
}

// ─── Not-found helper ─────────────────────────────────────────────────────────

export function EscrowDetailNotFound({ escrowId }: { escrowId: string }) {
  const e = ethitrustThemeTokens;
  return (
    <div className={cn(e.layout.container, "py-16 lg:py-24")}>
      <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
        Escrow
      </p>
      <h1 className={cn(e.typography.displayLG, "mt-2 font-serif font-normal")}>
        Not found
      </h1>
      <p className={cn(e.typography.bodyMuted, "mt-4 max-w-md")}>
        No escrow matches this link, or your session cannot access it anymore.
      </p>
      <p className="mt-4 font-mono text-xs text-muted-foreground break-all">
        {escrowId}
      </p>
      <Button className="mt-8 rounded-full" asChild>
        <Link href="/escrows">Back to escrows</Link>
      </Button>
    </div>
  );
}

// ─── Status pipeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: string }) {
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const currentIdx = getLifecycleIndex(status);

  if (isTerminal) {
    return (
      <div
        className={cn(
          "rounded-xl border px-5 py-4",
          status === "disputed"
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-muted/30",
        )}
      >
        <div className="flex items-center gap-3">
          {status === "disputed" ? (
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
          ) : (
            <XCircle className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              status === "disputed"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {status === "cancelled" && "This deal was cancelled."}
            {status === "rejected" &&
              "This deal was declined by the counterparty."}
            {status === "disputed" &&
              "This escrow is under dispute — see the action area below."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/60 px-5 py-5">
      <div className="flex items-start">
        {LIFECYCLE_STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isUpcoming = i > currentIdx;

          return (
            <div key={step.key} className="flex flex-1 items-start">
              {/* Step node */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isDone && "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground shadow-md ring-4 ring-primary/10",
                    isUpcoming &&
                      "border-border bg-background text-muted-foreground",
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "w-18 text-center text-[11px] leading-tight",
                    isCurrent && "font-semibold text-foreground",
                    isDone && "text-emerald-600 dark:text-emerald-400",
                    isUpcoming && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector */}
              {i < LIFECYCLE_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mt-3.5 h-0.5 flex-1",
                    i < currentIdx ? "bg-emerald-500" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Contextual action banner ─────────────────────────────────────────────────

interface ActionBannerProps {
  escrow: EscrowRow;
  party: "initiator" | "receiver" | "unknown";
  viewerRole: "Buyer" | "Seller" | null;
  milestones: MilestoneRow[];
  disputeId: string | null | undefined;
  acting: boolean;
  onAction: (action: EscrowAction, payload?: unknown) => void;
}

function ActionBanner({
  escrow,
  party,
  viewerRole,
  milestones,
  disputeId,
  acting,
  onAction,
}: ActionBannerProps) {
  const status = escrow.status;

  /* Completed ---------------------------------------------------------------- */
  if (status === "completed") {
    return (
      <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/20">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            Escrow complete
          </p>
          <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">
            This escrow is complete. Funds have been released to the seller.
          </p>
        </div>
      </div>
    );
  }

  /* Cancelled ---------------------------------------------------------------- */
  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-5">
        <XCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-semibold text-muted-foreground">Deal cancelled</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            This deal was cancelled. No further actions apply.
          </p>
        </div>
      </div>
    );
  }

  /* Rejected ----------------------------------------------------------------- */
  if (status === "rejected") {
    return (
      <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-5">
        <XCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-semibold text-muted-foreground">Deal declined</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            This deal was declined by the counterparty.
          </p>
        </div>
      </div>
    );
  }

  /* Disputed ----------------------------------------------------------------- */
  if (status === "disputed") {
    return (
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-destructive">Escrow under dispute</p>
          <p className="mt-0.5 text-sm text-destructive/80">
            This escrow is under active dispute. Navigate to the dispute room to
            participate in resolution.
          </p>
        </div>
        {disputeId ? (
          <Button
            size="sm"
            variant="destructive"
            className="shrink-0 rounded-full"
            asChild
          >
            <Link href={`/disputes/${encodeURIComponent(disputeId)}`}>
              Open dispute room
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  /* Invited — waiting (initiator) ------------------------------------------- */
  if (status === "invited" && party === "initiator") {
    return (
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/20">
        <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Waiting for counterparty to respond
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
            You can resend the invitation or cancel this deal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
            disabled={acting}
            onClick={() => onAction("resend")}
          >
            {acting ? "Working…" : "Resend invitation"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="rounded-full"
            disabled={acting}
            onClick={() => onAction("cancel")}
          >
            {acting ? "Working…" : "Cancel deal"}
          </Button>
        </div>
      </div>
    );
  }

  /* Invited — action needed (receiver) -------------------------------------- */
  if (status === "invited" && party === "receiver") {
    return (
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            You've been invited to this deal
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review the terms below carefully, then accept or decline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={acting}
            onClick={() => onAction("accept")}
          >
            {acting ? "Working…" : "Accept deal"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={acting}
            onClick={() => onAction("reject")}
          >
            {acting ? "Working…" : "Decline"}
          </Button>
        </div>
      </div>
    );
  }

  /* Pending funding — buyer ------------------------------------------------- */
  if (status === "pending_funding" && viewerRole === "Buyer") {
    return (
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <Landmark className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            Deal accepted — fund your wallet to begin
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Add funds to your wallet to activate this escrow and get work
            started.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full" asChild>
            <Link href="/wallet/deposit">
              <Landmark className="size-4" />
              Fund wallet
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={acting}
            onClick={() => onAction("cancel")}
          >
            {acting ? "Working…" : "Cancel deal"}
          </Button>
        </div>
      </div>
    );
  }

  /* Pending funding — seller ------------------------------------------------ */
  if (status === "pending_funding" && viewerRole === "Seller") {
    return (
      <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/20">
        <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Waiting for the buyer to fund
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
            The buyer needs to deposit funds before the escrow becomes active.
            No action needed from you yet.
          </p>
        </div>
      </div>
    );
  }

  /* Active — seller, milestone-based ---------------------------------------- */
  if (status === "active" && viewerRole === "Seller" && milestones.length > 0) {
    return (
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <Handshake className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            The deal is active — deliver your milestones
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Mark each milestone delivered below once you've completed that phase
            of work.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-full"
          asChild
        >
          <Link href={`/escrows/${encodeURIComponent(escrow.id)}/milestones`}>
            Manage milestones
          </Link>
        </Button>
      </div>
    );
  }

  /* Active — seller, single delivery ---------------------------------------- */
  if (status === "active" && viewerRole === "Seller") {
    return (
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <Handshake className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            The deal is active — deliver your work
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            When you've completed the work, submit it for buyer review to
            trigger the inspection period.
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 rounded-full"
          disabled={acting}
          onClick={() => onAction("submit")}
        >
          {acting ? "Working…" : "Mark as delivered"}
        </Button>
      </div>
    );
  }

  /* Active — buyer ---------------------------------------------------------- */
  if (status === "active" && viewerRole === "Buyer") {
    return (
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/20">
        <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Work is in progress
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
            When the seller marks work as delivered, you'll review and approve
            it here to release funds.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
          disabled={acting}
          onClick={() => onAction("cancel")}
        >
          {acting ? "Working…" : "Cancel deal"}
        </Button>
      </div>
    );
  }

  return null;
}

// ─── Inline milestone timeline ────────────────────────────────────────────────

interface MilestoneTimelineProps {
  milestones: MilestoneRow[];
  escrow: EscrowRow;
  viewerRole: "Buyer" | "Seller" | null;
  milestoneMutating: boolean;
  onMilestoneAction: (
    milestoneId: string,
    action: "deliver" | "approve",
  ) => void;
}

function milestoneBadgeVariant(status: string) {
  if (status === "completed") return "secondary" as const;
  if (status === "delivered") return "default" as const;
  return "outline" as const;
}

function MilestoneTimeline({
  milestones,
  escrow,
  viewerRole,
  milestoneMutating,
  onMilestoneAction,
}: MilestoneTimelineProps) {
  const progress = milestoneProgress(milestones, escrow.currency);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp
                className="size-4 text-muted-foreground"
                aria-hidden
              />
              Milestones
            </CardTitle>
            <CardDescription className="mt-1">
              {formatEscrowMoney(progress.done, escrow.currency)} of{" "}
              {formatEscrowMoney(progress.total, escrow.currency)} released
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 rounded-full text-xs text-muted-foreground"
            asChild
          >
            <Link href={`/escrows/${encodeURIComponent(escrow.id)}/milestones`}>
              Manage
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {/* Progress bar */}
        <div className="mb-5 space-y-1.5">
          <Progress value={progress.pct} className="h-2" />
          <p className="text-right text-xs text-muted-foreground">
            {progress.pct}% complete
          </p>
        </div>

        {/* Steps */}
        <ol className="space-y-0">
          {milestones.map((m, i) => {
            const canDeliver =
              viewerRole === "Seller" && m.status === "pending";
            const canApprove =
              viewerRole === "Buyer" && m.status === "delivered";
            const isLast = i === milestones.length - 1;

            return (
              <li key={m.id} className="flex gap-3">
                {/* Step indicator + connector line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      m.status === "completed"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : m.status === "delivered"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {m.status === "completed" ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className="mt-1 w-px flex-1 bg-border"
                      style={{ minHeight: 16 }}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className={cn("min-w-0 flex-1 pb-3", isLast && "pb-0")}>
                  <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{m.title}</p>
                      <Badge
                        variant={milestoneBadgeVariant(m.status)}
                        className="shrink-0 capitalize text-xs"
                      >
                        {m.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>
                        {formatEscrowMoney(m.amount, escrow.currency)}
                      </span>
                      <span>Due {formatEscrowDate(m.due_date)}</span>
                      <span>{m.inspection_hrs}h inspection</span>
                    </div>
                    {(canDeliver || canApprove) && (
                      <div className="mt-2.5">
                        <Button
                          size="sm"
                          className={cn(
                            "h-7 rounded-full text-xs",
                            canApprove
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "variant-outline",
                          )}
                          variant={canDeliver ? "outline" : "default"}
                          disabled={milestoneMutating}
                          onClick={() =>
                            onMilestoneAction(
                              m.id,
                              canDeliver ? "deliver" : "approve",
                            )
                          }
                        >
                          {milestoneMutating
                            ? "Working…"
                            : canDeliver
                              ? "Mark delivered"
                              : "Approve & release"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EscrowDetailView({ escrowId }: { escrowId: string }) {
  const e = ethitrustThemeTokens;
  const [showTechnical, setShowTechnical] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const escrowQuery = useQuery({
    queryKey: ["me", "escrows", escrowId],
    queryFn: () => fetchMeEscrow(accessToken!, escrowId),
    enabled: Boolean(accessToken && escrowId),
  });

  const milestonesQuery = useQuery({
    queryKey: ["me", "escrows", escrowId, "milestones"],
    queryFn: () => fetchMeEscrowMilestones(accessToken!, escrowId),
    enabled: Boolean(accessToken && escrowId && escrowQuery.isSuccess),
  });

  const disputeLinkQuery = useQuery({
    queryKey: ["me", "disputes", "for-escrow", escrowId],
    queryFn: async () => {
      const paginated = await fetchMeDisputes(accessToken!, 1, 100);
      const row = paginated.items.find(
        (d) => d.escrow_id === escrowId && disputeNeedsAttention(d),
      );
      return row?.id ?? null;
    },
    enabled: Boolean(accessToken && escrowId && escrowQuery.isSuccess),
  });

  const actionMutation = useMutation({
    mutationFn: (vars: { action: EscrowAction; payload?: unknown }) =>
      postMeEscrowAction(accessToken!, escrowId, vars.action, vars.payload),
    onSuccess: async (_row, vars) => {
      toast.success(statusLabel(vars.action));
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["me", "escrows"] }),
        qc.invalidateQueries({ queryKey: ["me", "escrows", escrowId] }),
        qc.invalidateQueries({
          queryKey: ["me", "escrows", escrowId, "milestones"],
        }),
        qc.invalidateQueries({ queryKey: ["me", "disputes"] }),
      ]);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Action failed");
    },
  });

  const milestoneMutation = useMutation({
    mutationFn: (vars: {
      milestoneId: string;
      action: "deliver" | "approve";
    }) =>
      postMeMilestoneAction(
        accessToken!,
        escrowId,
        vars.milestoneId,
        vars.action,
      ),
    onSuccess: async () => {
      toast.success("Milestone updated");
      await Promise.all([
        qc.invalidateQueries({
          queryKey: ["me", "escrows", escrowId, "milestones"],
        }),
        qc.invalidateQueries({ queryKey: ["me", "escrows", escrowId] }),
      ]);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Milestone action failed",
      );
    },
  });

  // ── Early returns ──────────────────────────────────────────────────────────

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, "py-8 lg:py-12")}>
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 rounded-full text-muted-foreground"
          asChild
        >
          <Link href="/escrows">
            <ArrowLeft className="size-4" />
            All escrows
          </Link>
        </Button>
        <Alert>
          <AlertTitle>Sign in to view escrow</AlertTitle>
          <AlertDescription>
            <Button asChild className="mt-3 rounded-full" size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (escrowQuery.isPending) {
    return (
      <div className={cn(e.layout.container, "space-y-6 py-8 lg:py-12")}>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full max-w-2xl rounded-lg" />
        <Skeleton className="h-64 w-full max-w-4xl rounded-xl" />
      </div>
    );
  }

  if (escrowQuery.isError) {
    const msg =
      escrowQuery.error instanceof Error
        ? escrowQuery.error.message
        : "Could not load escrow.";
    return (
      <div className={cn(e.layout.container, "py-8 lg:py-12")}>
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 rounded-full text-muted-foreground"
          asChild
        >
          <Link href="/escrows">
            <ArrowLeft className="size-4" />
            All escrows
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Escrow unavailable</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>{msg}</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              asChild
            >
              <Link href="/escrows">Return to list</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const escrow = escrowQuery.data as EscrowRow;
  const viewerId = meQuery.data?.id ?? "";
  const party = escrowPartyForViewer(escrow, viewerId);
  const milestones = milestonesQuery.data ?? [];
  const myRole = viewerRoleLabel(party, escrow.initiator_role);
  const counterpartyDisplay =
    escrow.receiver_email ||
    (escrow.receiver_id ? "Accepted" : "Pending invitation");
  const deliveryLabel = escrow.delivery_date
    ? formatEscrowDateTime(escrow.delivery_date)
    : "—";
  const acting = actionMutation.isPending;

  function handleAction(action: EscrowAction, payload?: unknown) {
    actionMutation.mutate({ action, payload });
  }

  function handleMilestoneAction(
    milestoneId: string,
    action: "deliver" | "approve",
  ) {
    milestoneMutation.mutate({ milestoneId, action });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <div className="flex flex-col gap-6">
        {/* Back button */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            asChild
          >
            <Link href="/escrows">
              <ArrowLeft className="size-4" />
              All escrows
            </Link>
          </Button>
        </div>

        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link href="/escrows" className="hover:text-foreground">
            Escrows
          </Link>
          <ChevronRight className="size-3.5 opacity-70" aria-hidden />
          <span className="max-w-[min(52ch,100%)] truncate text-foreground">
            {escrow.title}
          </span>
        </nav>

        {/* Page header */}
        <header className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadgeVariant(escrow.status)}>
              {statusLabel(escrow.status)}
            </Badge>
            <Badge variant="outline">
              {escrowTypeLabel(escrow.escrow_type)}
            </Badge>
            {myRole ? (
              <Badge variant="outline" className="bg-primary/5">
                You are the {myRole}
              </Badge>
            ) : null}
            {escrow.counter_status && escrow.counter_status !== "none" ? (
              <Badge variant="outline">
                Counter: {statusLabel(escrow.counter_status)}
              </Badge>
            ) : null}
            {typeof escrow.offer_version === "number" ? (
              <span className="text-xs text-muted-foreground">
                Offer v{escrow.offer_version}
              </span>
            ) : null}
          </div>
          <h1
            className={cn(
              e.typography.displayLG,
              "mt-3 font-serif font-normal tracking-tight text-foreground",
            )}
          >
            {escrow.title}
          </h1>
        </header>

        {/* ── Status lifecycle pipeline ─────────────────────────────────── */}
        <StatusTimeline status={escrow.status} />

        {/* ── Contextual action banner ──────────────────────────────────── */}
        <ActionBanner
          escrow={escrow}
          party={party}
          viewerRole={myRole}
          milestones={milestones}
          disputeId={disputeLinkQuery.data}
          acting={acting}
          onAction={handleAction}
        />

        {/* Dispute alert — only when dispute exists but escrow isn't in 'disputed' state */}
        {disputeLinkQuery.data && escrow.status !== "disputed" ? (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden />
            <AlertTitle>Open dispute</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>
                An active negotiation may need your attention for this escrow.
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                asChild
              >
                <Link
                  href={`/disputes/${encodeURIComponent(disputeLinkQuery.data!)}`}
                >
                  Open dispute room
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Counter-offer alert */}
        {escrow.counter_status && escrow.counter_status !== "none" ? (
          <Alert>
            <Scale aria-hidden />
            <AlertTitle>Counter-offer in progress</AlertTitle>
            <AlertDescription>
              Counter-offer status:{" "}
              <span className="font-medium text-foreground">
                {statusLabel(escrow.counter_status)}
              </span>
              . Negotiation details will surface here once counter snapshots are
              available.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Milestones loading error */}
        {milestonesQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Milestones unavailable</AlertTitle>
            <AlertDescription>
              {(milestonesQuery.error as Error)?.message ??
                "Could not load milestone schedule."}
            </AlertDescription>
          </Alert>
        ) : null}

        {/* ── Main content grid ─────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Terms & scope card */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Handshake
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                Terms & scope
              </CardTitle>
              <CardDescription>
                Amounts, timelines, and acceptance criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className={e.typography.statLabel}>Total amount</dt>
                  <dd className={cn(e.typography.statValue, "text-2xl")}>
                    {formatEscrowMoney(escrow.amount, escrow.currency)}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Platform fee</dt>
                  <dd className={cn(e.typography.statValue, "text-2xl")}>
                    {formatEscrowMoney(escrow.fee_amount ?? 0, escrow.currency)}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Fees paid by</dt>
                  <dd className="mt-1 text-sm font-medium capitalize">
                    {escrow.who_pays_fees}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Target delivery</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                    <CalendarClock
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    {deliveryLabel}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Inspection period</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {escrow.inspection_period} hours
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Dispute window</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {escrow.dispute_window} hours
                  </dd>
                </div>
              </dl>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {escrow.description?.trim() || "No description supplied."}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Acceptance criteria</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {escrow.acceptance_criteria?.trim() || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Parties — clean, no raw UUIDs */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Shield
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 text-sm">
                {myRole ? (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Your role
                    </p>
                    <p className="mt-1 font-semibold">{myRole}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Counterparty
                  </p>
                  <p className="mt-1 font-medium">{counterpartyDisplay}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Escrow type
                  </p>
                  <p className="mt-1 font-medium">
                    {escrowTypeLabel(escrow.escrow_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Created
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {formatEscrowDate(escrow.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            {milestonesQuery.isPending ? (
              <Card className="shadow-sm">
                <CardContent className="py-6">
                  <Skeleton className="h-24 w-full rounded-lg" />
                </CardContent>
              </Card>
            ) : milestones.length > 0 ? (
              <MilestoneTimeline
                milestones={milestones}
                escrow={escrow}
                viewerRole={myRole}
                milestoneMutating={milestoneMutation.isPending}
                onMilestoneAction={handleMilestoneAction}
              />
            ) : null}
          </div>
        </div>

        {/* ── Technical details (collapsed by default) ──────────────────── */}
        <div className="rounded-xl border border-border/60 bg-muted/20">
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setShowTechnical((prev) => !prev)}
            aria-expanded={showTechnical}
          >
            <span className="flex items-center gap-2">
              <Gavel className="size-4" />
              Technical details
            </span>
            <ChevronRight
              className={cn(
                "size-4 transition-transform",
                showTechnical && "rotate-90",
              )}
            />
          </button>

          {showTechnical && (
            <div className="border-t border-border/60 px-5 py-4">
              <dl className="grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Escrow ID
                  </dt>
                  <dd className="mt-0.5 break-all font-mono text-muted-foreground">
                    {escrow.id}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Initiator ID
                  </dt>
                  <dd className="mt-0.5 break-all font-mono text-muted-foreground">
                    {escrow.initiator_id ?? "—"}
                  </dd>
                </div>
                {escrow.receiver_id ? (
                  <div>
                    <dt className="font-medium text-muted-foreground">
                      Receiver ID
                    </dt>
                    <dd className="mt-0.5 break-all font-mono text-muted-foreground">
                      {escrow.receiver_id}
                    </dd>
                  </div>
                ) : null}
                {escrow.org_id ? (
                  <div>
                    <dt className="font-medium text-muted-foreground">
                      Org ID
                    </dt>
                    <dd className="mt-0.5 break-all font-mono text-muted-foreground">
                      {escrow.org_id}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-medium text-muted-foreground">Status</dt>
                  <dd className="mt-0.5 font-mono text-muted-foreground">
                    {escrow.status}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Counter status
                  </dt>
                  <dd className="mt-0.5 font-mono text-muted-foreground">
                    {escrow.counter_status ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Offer version
                  </dt>
                  <dd className="mt-0.5 font-mono text-muted-foreground">
                    {escrow.offer_version ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Initiator role
                  </dt>
                  <dd className="mt-0.5 font-mono text-muted-foreground">
                    {escrow.initiator_role}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Receiver email
                  </dt>
                  <dd className="mt-0.5 font-mono text-muted-foreground">
                    {escrow.receiver_email ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Invitation sent
                  </dt>
                  <dd className="mt-0.5 font-mono text-muted-foreground">
                    {String(escrow.invitation_sent ?? "—")}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Created at
                  </dt>
                  <dd className="mt-0.5 font-mono text-muted-foreground">
                    {escrow.created_at}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Updated at
                  </dt>
                  <dd className="mt-0.5 font-mono text-muted-foreground">
                    {escrow.updated_at}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
