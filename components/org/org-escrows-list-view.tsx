"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Handshake } from "lucide-react";

import { ClickableOrgEscrowRow } from "@/components/org/clickable-org-escrow-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  fetchOrgEscrowReportSummary,
  fetchOrgEscrowsList,
} from "@/lib/org-escrows/org-escrows-api";
import { useOrgRole } from "@/lib/org/use-org-role";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

// Public statuses from the org-escrow surface; matches OrgEscrowStatus.
const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "invited", label: "Invited" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "submitted", label: "Submitted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "disputed", label: "Disputed" },
  { value: "expired", label: "Expired" },
] as const;

const PAGE_SIZE = 20;

type UrlState = {
  status: string;
  search: string;
  page: number;
  isActive: boolean | null;
  dateFrom: string;
  dateTo: string;
};

function useOrgEscrowUrlState(): UrlState {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const isActiveParam = searchParams.get("is_active");
  const isActive =
    isActiveParam === "true"
      ? true
      : isActiveParam === "false"
      ? false
      : null;
  return {
    status,
    search,
    page,
    isActive,
    dateFrom: searchParams.get("date_from") ?? "",
    dateTo: searchParams.get("date_to") ?? "",
  };
}

function buildUrl(orgId: string, state: Partial<UrlState>): string {
  const sp = new URLSearchParams();
  if (state.status && state.status !== "all") sp.set("status", state.status);
  if (state.search) sp.set("search", state.search);
  if (state.page && state.page > 1) sp.set("page", String(state.page));
  if (state.isActive === true) sp.set("is_active", "true");
  if (state.isActive === false) sp.set("is_active", "false");
  if (state.dateFrom) sp.set("date_from", state.dateFrom);
  if (state.dateTo) sp.set("date_to", state.dateTo);
  const q = sp.toString();
  return q ? `/org/${orgId}/escrows?${q}` : `/org/${orgId}/escrows`;
}

function toApiDate(localDatetime: string): string | undefined {
  if (!localDatetime) return undefined;
  const t = Date.parse(localDatetime);
  if (Number.isNaN(t)) return undefined;
  return new Date(t).toISOString();
}

function formatPercent(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function formatHours(h: number | null | undefined): string {
  if (h == null || !Number.isFinite(h)) return "—";
  if (h < 1) return `${(h * 60).toFixed(0)}m`;
  if (h >= 24) return `${(h / 24).toFixed(1)}d`;
  return `${h.toFixed(1)}h`;
}

function StatCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  loading?: boolean;
}) {
  const { typography } = ethitrustThemeTokens;
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <p className={typography.statLabel}>{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <p className={cn(typography.statValue, "mt-1 text-2xl")}>{value}</p>
        )}
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FilterBar({
  orgId,
  state,
}: {
  orgId: string;
  state: UrlState;
}) {
  const router = useRouter();

  // Debounced search input — owns its own state so typing is smooth; we push
  // the URL only after the user stops typing (300ms).
  const [searchInput, setSearchInput] = useState(state.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(state.search);
  }, [state.search]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function pushUpdate(patch: Partial<UrlState>) {
    router.push(
      buildUrl(orgId, {
        ...state,
        ...patch,
        // Any filter change resets to page 1.
        page: patch.page ?? 1,
      }),
    );
  }

  function onSearchChange(v: string) {
    setSearchInput(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      pushUpdate({ search: v.trim() });
    }, 300);
  }

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="org-escrow-search" className="text-xs">
          Search
        </Label>
        <Input
          id="org-escrow-search"
          placeholder="Title, receiver email, escrow id"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-full"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org-escrow-status" className="text-xs">
          Status
        </Label>
        <Select
          value={state.status}
          onValueChange={(v) => pushUpdate({ status: v })}
        >
          <SelectTrigger
            id="org-escrow-status"
            className="w-full rounded-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org-escrow-from" className="text-xs">
          From
        </Label>
        <Input
          id="org-escrow-from"
          type="datetime-local"
          value={state.dateFrom}
          onChange={(e) => pushUpdate({ dateFrom: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org-escrow-to" className="text-xs">
          To
        </Label>
        <Input
          id="org-escrow-to"
          type="datetime-local"
          value={state.dateTo}
          onChange={(e) => pushUpdate({ dateTo: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2 pt-5 lg:pt-0 lg:self-end lg:pb-2">
        <Switch
          id="org-escrow-active"
          checked={state.isActive === true}
          onCheckedChange={(checked) =>
            pushUpdate({ isActive: checked ? true : null })
          }
        />
        <Label
          htmlFor="org-escrow-active"
          className="cursor-pointer text-sm font-medium"
        >
          Active only
        </Label>
      </div>
    </div>
  );
}

export function OrgEscrowsListView({ orgId }: { orgId: string }) {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);
  const state = useOrgEscrowUrlState();
  const { canManage } = useOrgRole(orgId);

  // Report range: last 30 days (matches the API default).
  const reportRange = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const listQuery = useQuery({
    queryKey: [
      "me",
      "org-escrows",
      "list",
      orgId,
      state.page,
      PAGE_SIZE,
      state.status,
      state.search,
      state.isActive,
      state.dateFrom,
      state.dateTo,
    ],
    queryFn: () =>
      fetchOrgEscrowsList(accessToken!, orgId, {
        page: state.page,
        pageSize: PAGE_SIZE,
        status: state.status === "all" ? undefined : state.status,
        search: state.search,
        isActive: state.isActive,
        dateFrom: toApiDate(state.dateFrom),
        dateTo: toApiDate(state.dateTo),
      }),
    enabled: Boolean(accessToken && orgId),
    staleTime: 30_000,
  });

  const reportQuery = useQuery({
    queryKey: [
      "me",
      "org-escrows",
      "report",
      orgId,
      reportRange.from,
      reportRange.to,
    ],
    queryFn: () =>
      fetchOrgEscrowReportSummary(
        accessToken!,
        orgId,
        reportRange.from,
        reportRange.to,
      ),
    enabled: Boolean(accessToken && orgId),
    staleTime: 60_000,
  });

  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(
    1,
    (listQuery.data?.total_pages ?? Math.ceil(total / PAGE_SIZE)) || 1,
  );

  const report = reportQuery.data;
  const reportLoading = reportQuery.isPending;

  const hasNoFiltersApplied =
    state.status === "all" &&
    !state.search &&
    state.isActive === null &&
    !state.dateFrom &&
    !state.dateTo;

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <header className="max-w-xl">
          <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
            Organization
          </p>
          <h1
            className={cn(
              e.typography.displayLG,
              "mt-2 font-serif font-normal text-foreground",
            )}
          >
            Escrows
          </h1>
          <p className={cn(e.typography.bodyMuted, "mt-3")}>
            Review escrows initiated on behalf of this organization. New
            escrows are created via the API.
          </p>
        </header>
      </div>

      {/* Stats strip — last 30 days */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total escrows"
          value={report?.total_escrows ?? 0}
          hint="Last 30 days"
          loading={reportLoading}
        />
        <StatCard
          label="Active"
          value={report?.active_escrow_count ?? 0}
          loading={reportLoading}
        />
        <StatCard
          label="Completion"
          value={formatPercent(report?.completion_rate)}
          loading={reportLoading}
        />
        <StatCard
          label="Dispute rate"
          value={formatPercent(report?.dispute_rate)}
          loading={reportLoading}
        />
        <StatCard
          label="Avg settlement"
          value={formatHours(report?.avg_settlement_time_hours ?? null)}
          loading={reportLoading}
        />
      </div>

      <FilterBar orgId={orgId} state={state} />

      {listQuery.isError ? (
        <p className="mt-8 text-sm text-destructive">
          {listQuery.error instanceof Error
            ? listQuery.error.message
            : "Could not load escrows"}{" "}
          ·{" "}
          <button
            type="button"
            className="underline-offset-2 hover:underline"
            onClick={() => listQuery.refetch()}
          >
            Retry
          </button>
        </p>
      ) : null}

      <Card className="mt-8 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Handshake className="size-4 text-muted-foreground" aria-hidden />
            Escrows
          </CardTitle>
          <CardDescription>
            {listQuery.isPending ? (
              "Loading…"
            ) : (
              <>
                Showing {rows.length === 0 ? 0 : (state.page - 1) * PAGE_SIZE + 1}–
                {(state.page - 1) * PAGE_SIZE + rows.length} of {total}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2 pt-0">
          {listQuery.isPending ? (
            <div className="space-y-3 px-6 py-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                {hasNoFiltersApplied
                  ? "No escrows yet"
                  : "No escrows match these filters"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasNoFiltersApplied
                  ? "Escrows created via your organization's API key will appear here."
                  : "Try clearing one of the filters above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-xl text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Receiver</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Funded
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="w-12 px-2 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <ClickableOrgEscrowRow
                      key={row.escrow_id}
                      orgId={orgId}
                      row={row}
                      canManage={canManage}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && !listQuery.isPending ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Page {state.page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              disabled={state.page <= 1}
              asChild
            >
              <Link
                href={buildUrl(orgId, { ...state, page: state.page - 1 })}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              disabled={state.page >= totalPages}
              asChild
            >
              <Link
                href={buildUrl(orgId, { ...state, page: state.page + 1 })}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
