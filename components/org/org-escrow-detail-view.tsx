"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Radio,
  ShieldAlert,
  Webhook,
  XCircle,
} from "lucide-react";

import { CancelOrgEscrowDialog } from "@/components/org/cancel-org-escrow-dialog";
import { OrgEscrowStatusBadge } from "@/components/org/org-escrow-status-badge";
import { ResendOrgEscrowInviteDialog } from "@/components/org/resend-org-escrow-invite-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatEscrowDate,
  formatEscrowDateTime,
  formatEscrowMoney,
} from "@/lib/escrows/format-escrow";
import {
  fetchOrgEscrowDetail,
  fetchOrgEscrowEvents,
  fetchOrgEscrowHealth,
  fetchOrgEscrowWebhookLogs,
} from "@/lib/org-escrows/org-escrows-api";
import { useOrgRole } from "@/lib/org/use-org-role";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

function severityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300";
    case "low":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
  }
}

export function OrgEscrowNotFound({
  orgId,
  escrowId,
}: {
  orgId: string;
  escrowId: string;
}) {
  const e = ethitrustThemeTokens;
  return (
    <div className={cn(e.layout.container, "py-16 lg:py-24")}>
      <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
        Organization escrow
      </p>
      <h1 className={cn(e.typography.displayLG, "mt-2 font-serif font-normal")}>
        Not found
      </h1>
      <p className={cn(e.typography.bodyMuted, "mt-4 max-w-md")}>
        This escrow is not available for this organization.
      </p>
      <p className="mt-4 break-all font-mono text-xs text-muted-foreground">
        {escrowId}
      </p>
      <Button className="mt-8 rounded-full" asChild>
        <Link href={`/org/${orgId}/escrows`}>Back to escrows</Link>
      </Button>
    </div>
  );
}

function HealthDot({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 rounded-full",
        ok ? "bg-emerald-500" : "bg-muted-foreground/40",
      )}
    />
  );
}

export function OrgEscrowDetailView({
  orgId,
  escrowId,
}: {
  orgId: string;
  escrowId: string;
}) {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);
  const { canManage } = useOrgRole(orgId);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["me", "org-escrows", "detail", orgId, escrowId],
    queryFn: () => fetchOrgEscrowDetail(accessToken!, orgId, escrowId),
    enabled: Boolean(accessToken && escrowId),
    retry: false,
  });

  const detail = detailQuery.data;
  const orgMatches = Boolean(
    detail && (!detail.organization_id || detail.organization_id === orgId),
  );
  const auxEnabled = Boolean(accessToken && detail && orgMatches);

  const eventsQuery = useQuery({
    queryKey: ["me", "org-escrows", "events", orgId, escrowId],
    queryFn: () => fetchOrgEscrowEvents(accessToken!, orgId, escrowId),
    enabled: auxEnabled,
  });

  const healthQuery = useQuery({
    queryKey: ["me", "org-escrows", "health", orgId, escrowId],
    queryFn: () => fetchOrgEscrowHealth(accessToken!, orgId, escrowId),
    enabled: auxEnabled,
  });

  const webhooksQuery = useQuery({
    queryKey: ["me", "org-escrows", "webhooks", orgId, escrowId],
    queryFn: () => fetchOrgEscrowWebhookLogs(accessToken!, orgId, escrowId),
    enabled: auxEnabled,
  });

  if (detailQuery.isPending) {
    return (
      <div className={cn(e.layout.container, "space-y-6 py-8 lg:py-12")}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (detailQuery.isError || !detail) {
    return <OrgEscrowNotFound orgId={orgId} escrowId={escrowId} />;
  }

  if (detail.organization_id && detail.organization_id !== orgId) {
    return <OrgEscrowNotFound orgId={orgId} escrowId={escrowId} />;
  }

  const showCancel = canManage && detail.can_cancel;
  const showResend = canManage && detail.can_resend_invite;
  const fundedPct =
    detail.amount > 0
      ? Math.min(100, (detail.funded_amount / detail.amount) * 100)
      : 0;

  const eventsBundle = eventsQuery.data;
  const health = healthQuery.data;
  const webhooks = webhooksQuery.data ?? [];

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            asChild
          >
            <Link href={`/org/${orgId}/escrows`}>
              <ArrowLeft className="size-4" />
              Escrows
            </Link>
          </Button>
        </div>

        <nav
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            href={`/org/${orgId}/escrows`}
            className="hover:text-foreground"
          >
            Escrows
          </Link>
          <ChevronRight className="size-3.5 opacity-70" aria-hidden />
          <span className="max-w-[min(52ch,100%)] truncate text-foreground">
            {detail.title}
          </span>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <OrgEscrowStatusBadge status={detail.status} />
              <Badge variant="outline" className="capitalize">
                {detail.escrow_type.replace(/_/g, " ")}
              </Badge>
              {!detail.is_active ? (
                <Badge variant="secondary">Inactive</Badge>
              ) : null}
            </div>
            <h1
              className={cn(
                e.typography.displayLG,
                "mt-3 font-serif font-normal tracking-tight text-foreground",
              )}
            >
              {detail.title}
            </h1>
            {detail.description ? (
              <p
                className={cn(
                  e.typography.bodyMuted,
                  "mt-3 max-w-2xl text-pretty",
                )}
              >
                {detail.description}
              </p>
            ) : null}
          </div>

          {showCancel || showResend ? (
            <div className="flex flex-wrap items-center gap-2">
              {showResend ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setResendOpen(true)}
                >
                  Resend invite
                </Button>
              ) : null}
              {showCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-destructive hover:text-destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="size-4" />
                  Cancel escrow
                </Button>
              ) : null}
            </div>
          ) : null}
        </header>

        {detail.risk_flags.length > 0 ? (
          <Alert variant="destructive">
            <ShieldAlert aria-hidden />
            <AlertTitle>Risk flags</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1.5">
                {detail.risk_flags.map((r) => (
                  <li key={r.code} className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", severityBadgeClass(r.severity))}
                    >
                      {r.severity}
                    </Badge>
                    <span className="font-medium">{r.code}</span>
                    <span className="text-muted-foreground">{r.message}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Summary card with progress */}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {detail.next_action ?? "Status"}
            </CardTitle>
            <CardDescription>
              Phase: {detail.current_phase}
              {detail.expires_at ? (
                <>
                  {" · "}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="underline-offset-2 hover:underline">
                        Expires {formatEscrowDate(detail.expires_at)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatEscrowDateTime(detail.expires_at)}
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Progress
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {detail.progress_percentage}%
                </span>
              </div>
              <Progress value={detail.progress_percentage} />
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Funded
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatEscrowMoney(detail.funded_amount, detail.currency)}{" "}
                  <span className="text-muted-foreground">
                    of {formatEscrowMoney(detail.amount, detail.currency)}
                  </span>
                </span>
              </div>
              <Progress value={fundedPct} />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">
              Timeline
              {eventsBundle ? (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                  {eventsBundle.total}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="webhooks">
              Webhooks
              {webhooks.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                  {webhooks.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="shadow-sm lg:col-span-2">
                <CardHeader className="border-b">
                  <CardTitle className="text-base font-semibold">
                    Economics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <dl className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <dt className={e.typography.statLabel}>Total amount</dt>
                      <dd className={cn(e.typography.statValue, "text-2xl")}>
                        {formatEscrowMoney(detail.amount, detail.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className={e.typography.statLabel}>Funded</dt>
                      <dd className={cn(e.typography.statValue, "text-2xl")}>
                        {formatEscrowMoney(
                          detail.funded_amount,
                          detail.currency,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className={e.typography.statLabel}>Platform fee</dt>
                      <dd className="mt-1 text-sm font-medium">
                        {formatEscrowMoney(
                          detail.fee_amount,
                          detail.currency,
                        )}{" "}
                        <span className="text-muted-foreground capitalize">
                          ({detail.who_pays_fees} pays)
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className={e.typography.statLabel}>Initiator role</dt>
                      <dd className="mt-1 text-sm font-medium capitalize">
                        {detail.initiator_role}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-base font-semibold">
                    Counterparty
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-6 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Receiver email
                    </p>
                    <p className="mt-0.5 font-medium break-all">
                      {detail.receiver_email ?? "—"}
                    </p>
                  </div>
                  {detail.receiver_id ? (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Receiver id
                      </p>
                      <p className="mt-0.5 break-all font-mono text-xs">
                        {detail.receiver_id}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="shadow-sm lg:col-span-2">
                <CardHeader className="border-b">
                  <CardTitle className="text-base font-semibold">
                    Timing
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <dl className="grid gap-4 sm:grid-cols-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Created
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{formatEscrowDate(detail.created_at)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatEscrowDateTime(detail.created_at)}
                          </TooltipContent>
                        </Tooltip>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Last update
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{formatEscrowDate(detail.updated_at)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatEscrowDateTime(detail.updated_at)}
                          </TooltipContent>
                        </Tooltip>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Expires
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {detail.expires_at ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{formatEscrowDate(detail.expires_at)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {formatEscrowDateTime(detail.expires_at)}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {detail.latest_event ? (
                <Card className="shadow-sm">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Activity
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                      Latest event
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 text-sm">
                    <p className="font-medium">
                      {detail.latest_event.event_type}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {detail.latest_event.actor}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            {formatEscrowDate(detail.latest_event.timestamp)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatEscrowDateTime(detail.latest_event.timestamp)}
                        </TooltipContent>
                      </Tooltip>
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-4">
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-semibold">
                  Audit trail
                </CardTitle>
                <CardDescription>
                  {eventsQuery.isPending
                    ? "Loading…"
                    : `${eventsBundle?.total ?? 0} events`}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0 pt-0">
                {eventsQuery.isPending ? (
                  <div className="space-y-3 px-6 py-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : !eventsBundle || eventsBundle.events.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No events recorded yet.
                  </p>
                ) : (
                  <ol className="relative px-6 py-6">
                    <div
                      aria-hidden
                      className="absolute left-[1.6875rem] top-7 bottom-7 w-px bg-border"
                    />
                    {eventsBundle.events.map((ev) => {
                      const hasMeta =
                        ev.metadata &&
                        Object.keys(ev.metadata).length > 0;
                      return (
                        <li
                          key={ev.event_id}
                          className="relative flex gap-4 py-3"
                        >
                          <div
                            className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-background"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">
                              {ev.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ev.actor} ·{" "}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>{formatEscrowDate(ev.timestamp)}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {formatEscrowDateTime(ev.timestamp)}
                                </TooltipContent>
                              </Tooltip>
                            </p>
                            {hasMeta ? (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                  Metadata
                                </summary>
                                <pre className="mt-2 overflow-x-auto rounded bg-muted/40 p-2 text-[11px] leading-relaxed">
                                  {JSON.stringify(ev.metadata, null, 2)}
                                </pre>
                              </details>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health */}
          <TabsContent value="health" className="mt-4">
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Radio
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  Health flags
                </CardTitle>
                <CardDescription>
                  Boolean state reported by the upstream engine.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {healthQuery.isPending ? (
                  <Skeleton className="h-24 w-full" />
                ) : health ? (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                    {(
                      [
                        ["Active", health.is_active],
                        ["Expired", health.is_expired],
                        ["Fundable", health.is_fundable],
                        ["Cancellable", health.is_cancellable],
                        ["Disputable", health.is_disputable],
                        ["Settled", health.is_settled],
                      ] as const
                    ).map(([label, val]) => (
                      <div
                        key={label}
                        className="flex items-center gap-2.5 rounded-lg border bg-card/40 px-3 py-2.5"
                      >
                        <HealthDot ok={val} />
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {label}
                          </p>
                          <p className="font-medium">{val ? "Yes" : "No"}</p>
                        </div>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Could not load health flags.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks */}
          <TabsContent value="webhooks" className="mt-4">
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Webhook
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  Webhook deliveries
                </CardTitle>
                <CardDescription>
                  Outgoing deliveries for this escrow.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-2 pt-0">
                {webhooksQuery.isPending ? (
                  <div className="space-y-3 px-6 py-8">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : webhooks.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No webhook attempts logged.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-xl text-left text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-3 font-medium">Event</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">HTTP</th>
                          <th className="px-4 py-3 font-medium">Attempt</th>
                          <th className="px-6 py-3 font-medium">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webhooks.map((w) => {
                          const failed =
                            (w.http_status != null && w.http_status >= 400) ||
                            w.delivery_status.toLowerCase() === "failed" ||
                            Boolean(w.error_message);
                          return (
                            <tr
                              key={w.id}
                              className={cn(
                                "border-b border-border/60 last:border-0",
                                failed ? "bg-destructive/5" : null,
                              )}
                            >
                              <td className="px-6 py-3">
                                <p className="font-medium">{w.event_type}</p>
                                <p className="mt-0.5 break-all text-xs text-muted-foreground">
                                  {w.target_url}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "capitalize",
                                    failed
                                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                                      : null,
                                  )}
                                >
                                  {w.delivery_status}
                                </Badge>
                                {w.error_message ? (
                                  <p className="mt-1 text-xs text-destructive">
                                    {w.error_message}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 tabular-nums">
                                {w.http_status ?? "—"}
                              </td>
                              <td className="px-4 py-3 tabular-nums">
                                {w.attempt}
                              </td>
                              <td className="px-6 py-3 text-muted-foreground">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      {formatEscrowDate(w.created_at)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {formatEscrowDateTime(w.created_at)}
                                  </TooltipContent>
                                </Tooltip>
                                {w.next_retry_at ? (
                                  <p className="mt-0.5 text-xs">
                                    Next retry{" "}
                                    {formatEscrowDate(w.next_retry_at)}
                                  </p>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation dialogs */}
      {canManage ? (
        <>
          <CancelOrgEscrowDialog
            orgId={orgId}
            escrowId={escrowId}
            escrowTitle={detail.title}
            open={cancelOpen}
            onOpenChange={setCancelOpen}
          />
          <ResendOrgEscrowInviteDialog
            orgId={orgId}
            escrowId={escrowId}
            receiverEmail={detail.receiver_email}
            open={resendOpen}
            onOpenChange={setResendOpen}
          />
        </>
      ) : null}
    </div>
  );
}
