"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Handshake, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
import { Skeleton } from "@/components/ui/skeleton";
import { escrowListStatusLabel } from "@/lib/escrows/escrow-table-display";
import { fetchOrgEscrowsList } from "@/lib/org-escrows/org-escrows-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "completed", label: "Completed" },
];

const PAGE_SIZE = 20;

function useOrgEscrowUrlState() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") ?? undefined;
  const tab =
    statusParam && FILTER_TABS.some((t) => t.value === statusParam)
      ? statusParam
      : "all";
  const search = searchParams.get("search")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  return { tab, search, page };
}

function pagerHref(
  orgId: string,
  nextPage: number,
  tab: string,
  search: string,
) {
  const sp = new URLSearchParams();
  if (nextPage > 1) sp.set("page", String(nextPage));
  if (tab !== "all") sp.set("status", tab);
  if (search) sp.set("search", search);
  const q = sp.toString();
  return q ? `/org/${orgId}/escrows?${q}` : `/org/${orgId}/escrows`;
}

function OrgEscrowSearchForm({
  orgId,
  tab,
  initialSearch,
}: {
  orgId: string;
  tab: string;
  initialSearch: string;
}) {
  return (
    <form
      className="mt-6 max-w-md"
      action={`/org/${orgId}/escrows`}
      method="get"
    >
      {tab !== "all" ? <input type="hidden" name="status" value={tab} /> : null}
      <div className="flex gap-2">
        <Input
          name="search"
          placeholder="Search title, email, escrow id"
          defaultValue={initialSearch}
          className="rounded-full"
        />
        <Button
          type="submit"
          variant="secondary"
          className="shrink-0 rounded-full"
        >
          Search
        </Button>
      </div>
    </form>
  );
}

export function OrgEscrowsListView({ orgId }: { orgId: string }) {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);
  const { tab, search, page } = useOrgEscrowUrlState();

  const listQuery = useQuery({
    queryKey: [
      "me",
      "org-escrows",
      "list",
      orgId,
      page,
      PAGE_SIZE,
      tab,
      search,
    ],
    queryFn: () =>
      fetchOrgEscrowsList(accessToken!, {
        page,
        pageSize: PAGE_SIZE,
        status: tab === "all" ? undefined : tab,
        search,
      }),
    enabled: Boolean(accessToken && orgId),
    staleTime: 30_000,
  });

  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(
    1,
    (listQuery.data?.total_pages ?? Math.ceil(total / PAGE_SIZE)) || 1,
  );

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
            Org escrows
          </h1>
          <p className={cn(e.typography.bodyMuted, "mt-3")}>
            Filter and search escrows.
          </p>
        </header>
        <Button
          className="shrink-0 rounded-full self-start lg:self-auto"
          asChild
        >
          <Link href={`/org/${orgId}/escrows/new`}>
            <PlusCircle />
            New org escrow
          </Link>
        </Button>
      </div>

      <OrgEscrowSearchForm orgId={orgId} tab={tab} initialSearch={search} />

      <div
        className="mt-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter by status"
      >
        {FILTER_TABS.map((t) => {
          const active = tab === t.value;
          const sp = new URLSearchParams();
          if (t.value !== "all") sp.set("status", t.value);
          if (search) sp.set("search", search);
          const q = sp.toString();
          const href = q
            ? `/org/${orgId}/escrows?${q}`
            : `/org/${orgId}/escrows`;
          return (
            <Link
              key={t.value}
              href={href}
              role="tab"
              aria-selected={active}
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

      {listQuery.isError ? (
        <p className="mt-8 text-sm text-destructive">
          {listQuery.error instanceof Error
            ? listQuery.error.message
            : "Could not load org escrows"}
        </p>
      ) : null}

      <Card className="mt-8 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Handshake className="size-4 text-muted-foreground" aria-hidden />
            Organization deals
          </CardTitle>
          <CardDescription>
            {listQuery.isPending ? (
              "Loading…"
            ) : (
              <>
                Showing {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {(page - 1) * PAGE_SIZE + rows.length} of {total}
                {tab !== "all" ? ` · ${escrowListStatusLabel(tab)}` : ""}
                {search ? ` · search: “${search}”` : ""}
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
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No org escrows match this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-xl text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Counterparty</th>
                    <th className="px-4 py-3 font-medium text-right">Funded</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <ClickableOrgEscrowRow
                      key={row.escrow_id}
                      orgId={orgId}
                      row={row}
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
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              disabled={page <= 1}
              asChild
            >
              <Link
                href={pagerHref(orgId, page - 1, tab, search)}
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
              disabled={page >= totalPages}
              asChild
            >
              <Link
                href={pagerHref(orgId, page + 1, tab, search)}
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
