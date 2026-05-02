"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Radio,
  ShieldAlert,
  Webhook,
} from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  escrowListStatusBadgeVariant,
  escrowListStatusLabel,
} from "@/lib/escrows/escrow-table-display";
import {
  formatEscrowDateTime,
  formatEscrowMoney,
} from "@/lib/escrows/format-escrow";
import {
  fetchOrgEscrowDetail,
  fetchOrgEscrowEvents,
  fetchOrgEscrowHealth,
  fetchOrgEscrowWebhookLogs,
  postOrgEscrowCancel,
  postOrgEscrowResend,
} from "@/lib/org-escrows/org-escrows-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

function bumpOrgEscrowQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["me", "org-escrows"] });
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
        <Link href={`/org/${orgId}/escrows`}>Back to org escrows</Link>
      </Button>
    </div>
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
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ["me", "org-escrows", "detail", orgId, escrowId],
    queryFn: () => fetchOrgEscrowDetail(accessToken!, escrowId),
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
    queryFn: () => fetchOrgEscrowEvents(accessToken!, escrowId),
    enabled: auxEnabled,
  });

  const healthQuery = useQuery({
    queryKey: ["me", "org-escrows", "health", orgId, escrowId],
    queryFn: () => fetchOrgEscrowHealth(accessToken!, escrowId),
    enabled: auxEnabled,
  });

  const webhooksQuery = useQuery({
    queryKey: ["me", "org-escrows", "webhooks", orgId, escrowId],
    queryFn: () => fetchOrgEscrowWebhookLogs(accessToken!, escrowId),
    enabled: auxEnabled,
  });

  const cancelMutation = useMutation({
    mutationFn: () => postOrgEscrowCancel(accessToken!, escrowId),
    onSuccess: () => bumpOrgEscrowQueries(queryClient),
  });

  const resendMutation = useMutation({
    mutationFn: () => postOrgEscrowResend(accessToken!, escrowId),
    onSuccess: () => bumpOrgEscrowQueries(queryClient),
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

  const eventsBundle = eventsQuery.data;
  const health = healthQuery.data;
  const webhooks = webhooksQuery.data ?? [];

  const acting = cancelMutation.isPending || resendMutation.isPending;

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
              Org escrows
            </Link>
          </Button>
        </div>

        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link
            href={`/org/${orgId}/escrows`}
            className="hover:text-foreground"
          >
            Org escrows
          </Link>
          <ChevronRight className="size-3.5 opacity-70" aria-hidden />
          <span className="max-w-[min(52ch,100%)] truncate text-foreground">
            {detail.title}
          </span>
        </nav>

        <header className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={escrowListStatusBadgeVariant(detail.status)}>
              {escrowListStatusLabel(detail.status)}
            </Badge>
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
          <p
            className={cn(e.typography.bodyMuted, "mt-3 max-w-2xl text-pretty")}
          >
            {detail.description}
          </p>
        </header>

        {detail.risk_flags.length > 0 ? (
          <Alert variant="destructive">
            <ShieldAlert aria-hidden />
            <AlertTitle>Risk flags</AlertTitle>
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1">
                {detail.risk_flags.map((r) => (
                  <li key={r.code}>
                    <span className="font-medium">{r.code}</span>: {r.message} (
                    {r.severity})
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Next action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium leading-relaxed">
              {detail.next_action}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Phase: {detail.current_phase}</span>
              <span>Progress: {detail.progress_percentage}%</span>
              <span>Expires {formatEscrowDateTime(detail.expires_at)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-semibold">
                Economics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className={e.typography.statLabel}>Escrow amount</dt>
                  <dd className={cn(e.typography.statValue, "text-2xl")}>
                    {formatEscrowMoney(detail.amount, detail.currency)}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Funded</dt>
                  <dd className={cn(e.typography.statValue, "text-2xl")}>
                    {formatEscrowMoney(detail.funded_amount, detail.currency)}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Fee</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatEscrowMoney(detail.fee_amount, detail.currency)} (
                    {detail.who_pays_fees} pays)
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Counterparty</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {detail.receiver_email}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-semibold">
                Capabilities
              </CardTitle>
              <CardDescription>From escrow detail payload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex flex-wrap gap-2">
                {detail.can_cancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={acting || cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate()}
                  >
                    {cancelMutation.isPending ? (
                      <>
                        <Spinner className="size-3" aria-hidden />
                        Cancelling…
                      </>
                    ) : (
                      "Cancel escrow"
                    )}
                  </Button>
                ) : null}
                {detail.can_resend_invite ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={acting || resendMutation.isPending}
                    onClick={() => resendMutation.mutate()}
                  >
                    {resendMutation.isPending ? (
                      <>
                        <Spinner className="size-3" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      "Resend invite"
                    )}
                  </Button>
                ) : null}
                {detail.can_accept ? (
                  <Button
                    type="button"
                    disabled
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                  >
                    Accept (counterparty)
                  </Button>
                ) : null}
              </div>
              {cancelMutation.isError || resendMutation.isError ? (
                <p className="text-xs text-destructive">
                  {(cancelMutation.error ?? resendMutation.error) instanceof
                  Error
                    ? String(cancelMutation.error ?? resendMutation.error)
                    : "Action failed"}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

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
              <p className="font-medium">{detail.latest_event.event_type}</p>
              <p className="text-muted-foreground">
                {detail.latest_event.actor} ·{" "}
                {formatEscrowDateTime(detail.latest_event.timestamp)}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {eventsQuery.isPending ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : eventsBundle ? (
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-semibold">
                Audit trail
              </CardTitle>
              <CardDescription>{eventsBundle.total} events</CardDescription>
            </CardHeader>
            <CardContent className="divide-y px-0 pb-0 pt-0">
              {eventsBundle.events.map((ev) => (
                <div key={ev.event_id} className="px-6 py-4 text-sm">
                  <p className="font-medium">{ev.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.actor} · {formatEscrowDateTime(ev.timestamp)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {healthQuery.isPending ? (
          <Skeleton className="h-36 rounded-xl" />
        ) : health ? (
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Radio className="size-4 text-muted-foreground" aria-hidden />
                Health flags
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
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
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-0.5 font-medium">{val ? "Yes" : "No"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ) : null}

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Webhook className="size-4 text-muted-foreground" aria-hidden />
              Webhook deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2 pt-0">
            {webhooksQuery.isPending ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : webhooks.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
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
                      <th className="px-6 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((w) => (
                      <tr
                        key={w.id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-6 py-3">
                          <p className="font-medium">{w.event_type}</p>
                          <p className="mt-0.5 break-all text-xs text-muted-foreground">
                            {w.target_url}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{w.delivery_status}</Badge>
                          {w.error_message ? (
                            <p className="mt-1 text-xs text-destructive">
                              {w.error_message}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {w.http_status}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {formatEscrowDateTime(w.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
