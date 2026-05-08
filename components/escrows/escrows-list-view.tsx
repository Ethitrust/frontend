"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Handshake,
  PlusCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClickableEscrowRow } from "@/components/escrows/clickable-escrow-row";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { escrowPartyForViewer } from "@/lib/escrows/escrow-party";
import { fetchAuthMe } from "@/lib/auth/me-session-api";
import { fetchMeEscrows } from "@/lib/escrows/me-escrows-api";
import {
  escrowListStatusLabel,
  escrowListStatusBadgeVariant,
} from "@/lib/escrows/escrow-table-display";
import type { EscrowRow } from "@/lib/escrows/escrow-list-types";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All deals" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Pending invite" },
  { value: "pending_funding", label: "Awaiting funds" },
  { value: "completed", label: "Completed" },
];

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterEscrowsOnPage(items: EscrowRow[], status: string) {
  if (!status || status === "all") return items;
  return items.filter((e) => e.status === status);
}

function roleLabelForRow(row: EscrowRow, viewerId: string): string {
  const party = escrowPartyForViewer(row, viewerId);
  if (party === "initiator") {
    return row.initiator_role === "buyer"
      ? "Buyer (initiator)"
      : "Seller (initiator)";
  }
  if (party === "receiver") {
    return row.initiator_role === "buyer"
      ? "Seller (counterparty)"
      : "Buyer (counterparty)";
  }
  return row.initiator_role === "buyer" ? "Buyer-related" : "Counterparty";
}

function rowNeedsAction(row: EscrowRow, viewerId: string): boolean {
  const party = escrowPartyForViewer(row, viewerId);
  if (row.status === "invited" && party === "receiver") return true;
  if (row.status === "pending_funding") {
    // Buyer is responsible for funding
    const buyerRole = row.initiator_role === "buyer" ? "initiator" : "receiver";
    if (party === buyerRole) return true;
  }
  return false;
}

function attentionCardLabel(row: EscrowRow, viewerId: string): string {
  const party = escrowPartyForViewer(row, viewerId);
  if (row.status === "invited" && party === "receiver")
    return "Waiting for your response";
  if (row.status === "pending_funding") return "Needs funding";
  return "Action required";
}

function attentionCardCta(row: EscrowRow, viewerId: string): string {
  const party = escrowPartyForViewer(row, viewerId);
  if (row.status === "invited" && party === "receiver")
    return "Respond to invite →";
  if (row.status === "pending_funding") return "Fund now →";
  return "View deal →";
}

// ─── Attention banner ─────────────────────────────────────────────────────────

function AttentionBanner({
  escrows,
  viewerId,
}: {
  escrows: EscrowRow[];
  viewerId: string;
}) {
  const actionEscrows = escrows.filter((e) => rowNeedsAction(e, viewerId));
  if (actionEscrows.length === 0) return null;

  return (
    <section aria-label="Deals requiring your attention" className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="size-4 text-amber-500" aria-hidden />
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          Action required on {actionEscrows.length} deal
          {actionEscrows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Horizontal scroll on ≥sm, stacked on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:overflow-x-auto sm:pb-1">
        {actionEscrows.map((escrow) => (
          <Link
            key={escrow.id}
            href={`/escrows/${escrow.id}`}
            className={cn(
              "group flex min-w-65 max-w-sm shrink-0 flex-col gap-1.5 rounded-lg border p-4",
              "border-l-4 border-amber-200 border-l-amber-400 bg-amber-50",
              "transition-colors hover:bg-amber-100",
              "dark:border-amber-800 dark:border-l-amber-500 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
            )}
          >
            <p className="line-clamp-1 text-sm font-semibold text-foreground">
              {escrow.title}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {attentionCardLabel(escrow, viewerId)}
            </p>
            <span className="mt-1 text-xs font-medium text-amber-700 group-hover:underline dark:text-amber-400">
              {attentionCardCta(escrow, viewerId)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Empty state (zero escrows ever) ─────────────────────────────────────────

function ZeroEscrowsState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted/60">
        <Handshake className="size-8 text-muted-foreground/50" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        No escrows yet
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Create your first escrow to start transacting securely. Invite a
        counterparty, set your terms, and let us hold the funds safely.
      </p>
      <Button asChild size="sm" className="mt-6 gap-2 rounded-full">
        <Link href="/escrows/new">
          <PlusCircle className="size-3.5" aria-hidden />
          Create your first escrow →
        </Link>
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EscrowsListView({ status: statusParam }: { status?: string }) {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);
  const tab =
    statusParam && FILTER_TABS.some((t) => t.value === statusParam)
      ? statusParam
      : "all";
  const [page, setPage] = useState(1);

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const listQuery = useQuery({
    queryKey: ["me", "escrows", "list", page, PAGE_SIZE],
    queryFn: () => fetchMeEscrows(accessToken!, page, PAGE_SIZE),
    enabled: Boolean(accessToken),
  });

  const viewerId = meQuery.data?.id ?? "";
  const chunk = listQuery.data?.items ?? [];
  const rows = useMemo(() => filterEscrowsOnPage(chunk, tab), [chunk, tab]);
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, "py-16 lg:py-24")}>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary/10 ring-1 ring-primary/20">
            <ShieldCheck className="size-10 text-primary/70" aria-hidden />
          </div>
          <h1
            className={cn(
              e.typography.displayLG,
              "font-serif font-normal text-foreground",
            )}
          >
            Secure your deals with escrow
          </h1>
          <p className={cn(e.typography.bodyMuted, "mx-auto mt-4 text-center")}>
            Sign in to view and manage escrows where you are the buyer, seller,
            or invited counterparty. Your funds, your terms.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/signin">Sign in to continue</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header className="max-w-xl">
          <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
            Transact
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
            Secure deals with clear acceptance criteria, inspection windows, and
            milestone releases.
          </p>
        </header>

        <Button
          asChild
          className="shrink-0 gap-2 self-start rounded-full sm:self-auto"
        >
          <Link href="/escrows/new">
            <PlusCircle className="size-4" aria-hidden />
            New escrow
          </Link>
        </Button>
      </div>

      {/* Error alert */}
      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>Could not load escrows</AlertTitle>
          <AlertDescription>
            {(listQuery.error as Error).message || "Request failed."}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Action-required attention cards */}
      {!listQuery.isPending && viewerId ? (
        <AttentionBanner escrows={chunk} viewerId={viewerId} />
      ) : null}

      {/* Status filter tabs */}
      <div
        className="mt-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter escrows by status"
      >
        {FILTER_TABS.map((t) => {
          const active = tab === t.value;
          const href =
            t.value === "all"
              ? "/escrows"
              : `/escrows?status=${encodeURIComponent(t.value)}`;
          return (
            <Link
              key={t.value}
              href={href}
              role="tab"
              aria-selected={active}
              scroll={false}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Main deal table card */}
      <Card className="mt-6 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Handshake className="size-4 text-muted-foreground" aria-hidden />
            Your deals
          </CardTitle>
          <CardDescription>
            {listQuery.isPending ? (
              "Loading…"
            ) : tab === "all" ? (
              <>
                {chunk.length} escrow{chunk.length !== 1 ? "s" : ""} on page{" "}
                {page} of {totalPages} · {total} total records
              </>
            ) : (
              <>
                {rows.length} matching &ldquo;{escrowListStatusLabel(tab)}
                &rdquo; on this page ({chunk.length} loaded of {total} total).
                Other pages may also match.
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 pb-2 pt-0">
          {/* Loading skeletons */}
          {listQuery.isPending ? (
            <div className="space-y-3 px-6 py-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : total === 0 ? (
            /* True empty state — user has no escrows at all */
            <ZeroEscrowsState />
          ) : rows.length === 0 ? (
            /* Filtered empty state — no rows on this page for the chosen tab */
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No escrows match this filter on this page.{" "}
                {tab !== "all" ? (
                  <Link
                    href="/escrows"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Clear filter
                  </Link>
                ) : (
                  "Try another page."
                )}
              </p>
            </div>
          ) : (
            /* Deal rows */
            <div className="overflow-x-auto">
              <table className="w-full min-w-xl text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Your role</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <ClickableEscrowRow
                      key={row.id}
                      row={row}
                      roleLabel={
                        viewerId
                          ? roleLabelForRow(row, viewerId)
                          : meQuery.isPending
                            ? "…"
                            : "Sign in"
                      }
                      actionNeeded={
                        viewerId ? rowNeedsAction(row, viewerId) : false
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-4 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page <= 1 || listQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page >= totalPages || listQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
