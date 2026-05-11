"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  GitCompareArrows,
  Handshake,
  Key,
  Layers,
  Terminal,
  Timer,
  TrendingUp,
  Webhook,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatEscrowDate,
  formatEscrowMoney,
} from "@/lib/escrows/format-escrow";
import { fetchOrgEscrowReportSummary } from "@/lib/org-escrows/org-escrows-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

function formatRate(rate: number) {
  if (rate <= 1 && rate >= 0) {
    return `${(rate * 100).toFixed(1)}%`;
  }
  return `${rate.toFixed(1)}%`;
}

function utcMonthIsoRange(now = new Date()) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  return { from: start.toISOString(), to: end.toISOString() };
}

export function OrgDashboardView({ orgId }: { orgId: string }) {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);
  const { from, to } = useMemo(() => utcMonthIsoRange(), []);

  const reportQuery = useQuery({
    queryKey: ["me", "org-escrows", "report", orgId, from, to],
    queryFn: () => fetchOrgEscrowReportSummary(accessToken!, orgId, from, to),
    enabled: Boolean(accessToken && orgId),
    staleTime: 60_000,
  });

  const report = reportQuery.data;

  const orgMismatch =
    report && report.organization_id && report.organization_id !== orgId
      ? `Report payload organization_id (${report.organization_id}) does not match this workspace (${orgId}). Multi-org JWT scoping may need configuration.`
      : null;

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
          Organization
        </p>
        <h1
          className={cn(
            e.typography.displayLG,
            "mt-2 font-serif font-normal text-foreground",
          )}
        >
          Dashboard
        </h1>
        <p className={cn(e.typography.bodyMuted, "mt-3")}>
          ({formatEscrowDate(from)} – {formatEscrowDate(to)}).
        </p>
      </header>

      {reportQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load org report</AlertTitle>
          <AlertDescription>
            {reportQuery.error instanceof Error
              ? reportQuery.error.message
              : "Request failed"}
          </AlertDescription>
        </Alert>
      ) : null}

      {orgMismatch ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Organization mismatch</AlertTitle>
          <AlertDescription>{orgMismatch}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button className="rounded-full" asChild>
          <Link href={`/org/${orgId}/escrows`}>
            <Handshake className="size-4" />
            Org escrows
          </Link>
        </Button>
        <Button variant="secondary" className="rounded-full" asChild>
          <Link href={`/org/${orgId}/wallet`}>
            Wallets
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full" asChild>
          <Link href={`/org/${orgId}/settings`}>
            <Terminal className="size-4" />
            Developer Hub
          </Link>
        </Button>
      </div>

      {reportQuery.isPending ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Layers className="size-3.5" aria-hidden />
                  Total escrows
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {report.total_escrows}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                In selected period ({formatEscrowDate(report.period_from)} –{" "}
                {formatEscrowDate(report.period_to)})
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="size-3.5" aria-hidden />
                  Active
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {report.active_escrow_count}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Open org escrows requiring attention
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <BarChart3 className="size-3.5" aria-hidden />
                  Completion rate
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {formatRate(report.completion_rate)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Share of escrows completed in period
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <GitCompareArrows className="size-3.5" aria-hidden />
                  Dispute rate
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {formatRate(report.dispute_rate)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Escrows entering dispute in period
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Timer className="size-4 text-muted-foreground" aria-hidden />
                Average settlement time
              </CardTitle>
              <CardDescription>
                <span className="font-mono text-xs">
                  avg_settlement_time_hours
                </span>{" "}
                from the report payload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {report.avg_settlement_time_hours != null 
                  ? report.avg_settlement_time_hours.toLocaleString("en-GB", {
                      maximumFractionDigits: 1,
                    })
                  : "N/A"}{" "}
                <span className="text-lg font-normal text-muted-foreground">
                  hours
                </span>
              </p>
            </CardContent>
          </Card>

          <div className="mt-12">
            <h2 className="text-xl font-semibold">Escrow as a Service (EaaS)</h2>
            <p className="text-muted-foreground mt-1">Integrate Ethitrust escrow directly into your platform.</p>
            
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <Card className="bg-primary/5 border-primary/10 shadow-none">
                <CardHeader>
                  <Key className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">API Keys</CardTitle>
                  <CardDescription>Authenticate your backend requests with secure, scoped keys.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0 h-auto gap-2" asChild>
                    <Link href={`/org/${orgId}/settings`}>
                      Manage keys <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/10 shadow-none">
                <CardHeader>
                  <Webhook className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">Webhooks</CardTitle>
                  <CardDescription>Receive real-time updates when escrow states change.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0 h-auto gap-2" asChild>
                    <Link href={`/org/${orgId}/developer`}>
                      Configure webhooks <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/10 shadow-none">
                <CardHeader>
                  <Terminal className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">API Reference</CardTitle>
                  <CardDescription>Explore our developer documentation and integration guides.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0 h-auto gap-2" asChild>
                    <Link href={`/org/${orgId}/developer`}>
                      View Integration Guide <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-6 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-semibold">
                Volume over time
              </CardTitle>
              <CardDescription>
                Points from{" "}
                <span className="font-mono text-xs">volume_over_time[]</span>{" "}
                (mixed currencies may be aggregated — amounts shown without
                per-point currency).
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              {report.volume_over_time.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No volume rows for this period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-xl text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Escrows
                        </th>
                        <th className="px-6 py-3 font-medium text-right">
                          Total amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.volume_over_time.map((row) => (
                        <tr
                          key={row.date}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-6 py-3 tabular-nums text-muted-foreground">
                            {row.date}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {row.count}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums font-medium">
                            {formatEscrowMoney(row.total_amount, "ETB")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
