"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { useNotificationReadMutations } from "@/components/notifications/use-notification-read-mutations";
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
import { Spinner } from "@/components/ui/spinner";
import { formatEscrowDateTime } from "@/lib/escrows/format-escrow";
import { fetchMeNotifications } from "@/lib/notifications/me-notifications-api";
import type { NotificationRow } from "@/lib/notifications/notification-types";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const PAGE_SIZE = 20;

function PageNotificationRow({
  row,
  onActivate,
  busyId,
}: {
  row: NotificationRow;
  onActivate: (id: string) => void;
  busyId: string | null;
}) {
  const busy = busyId === row.id;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onActivate(row.id)}
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl border px-5 py-4 text-left transition-colors",
        row.is_read
          ? "border-border bg-transparent hover:bg-muted/30"
          : "border-accent/35 bg-muted/20 hover:bg-muted/35",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {!row.is_read ? (
              <span
                className="size-2 shrink-0 rounded-full bg-accent"
                title="Unread"
                aria-hidden
              />
            ) : null}
            <h3 className="text-base font-semibold leading-snug">
              {row.title}
            </h3>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {row.body}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatEscrowDateTime(row.created_at)}
          </span>
          <span className="max-w-[12rem] truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {row.notification_type?.replace(/_/g, " ") || "—"}
          </span>
        </div>
      </div>
      {busy ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Spinner className="size-3" aria-hidden />
          Marking as read…
        </span>
      ) : null}
    </button>
  );
}

export function UserNotificationsView() {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { markRead, markAllRead } = useNotificationReadMutations(accessToken);

  const listQuery = useQuery({
    queryKey: ["me", "notifications", "list", page, PAGE_SIZE, unreadOnly],
    queryFn: () =>
      fetchMeNotifications(accessToken!, {
        page,
        pageSize: PAGE_SIZE,
        unreadOnly,
      }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const unreadCount = listQuery.data?.unread_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);

  const vid = markRead.variables;
  const busySingleId =
    markRead.isPending && Array.isArray(vid) && vid.length === 1
      ? vid[0]!
      : null;

  const pagerLabel = useMemo(() => {
    if (total === 0) return "No items";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `${start}–${end} of ${total}`;
  }, [page, total]);

  function onRowActivate(notificationId: string) {
    const row = items.find((n) => n.id === notificationId);
    if (row?.is_read) return;
    markRead.mutate([notificationId]);
  }

  function toggleUnreadFilter() {
    setUnreadOnly((v) => !v);
    setPage(1);
  }

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, "py-8 lg:py-12")}>
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
            Inbox
          </p>
          <h1
            className={cn(
              e.typography.displayLG,
              "mt-2 font-serif font-normal text-foreground",
            )}
          >
            Notifications
          </h1>
          <p className={cn(e.typography.bodyMuted, "mt-3")}>
            Sign in to read in-app messages from escrows, wallet, and
            compliance.
          </p>
        </header>
        <Card className="mt-10 max-w-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sign in required
            </CardTitle>
            <CardDescription>
              Notifications are scoped to your Ethi-Trust session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full">
              <Link href="/signin">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 rounded-full text-muted-foreground"
            asChild
          >
            <Link href="/dashboard">
              <ArrowLeft className="size-4" aria-hidden />
              Dashboard
            </Link>
          </Button>
          <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
            Inbox
          </p>
          <h1
            className={cn(
              e.typography.displayLG,
              "font-serif font-normal text-foreground",
            )}
          >
            Notifications
          </h1>
          <p className={cn(e.typography.bodyMuted, "mt-2 max-w-2xl")}>
            Newest first. Tap an unread row to mark it read, or mark everything
            at once.
          </p>
        </div>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load notifications</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "Request failed"}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={unreadOnly ? "secondary" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={toggleUnreadFilter}
        >
          {unreadOnly
            ? "Unread only"
            : unreadCount
              ? `All · ${unreadCount} unread`
              : "All notifications"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={
            markAllRead.isPending || unreadCount === 0 || listQuery.isPending
          }
          onClick={() => markAllRead.mutate()}
        >
          {markAllRead.isPending ? (
            <>
              <Spinner className="size-3.5" aria-hidden />
              Marking all…
            </>
          ) : (
            "Mark all read"
          )}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {listQuery.isPending ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              {unreadOnly
                ? "No unread notifications."
                : "Nothing in your inbox yet."}
            </CardContent>
          </Card>
        ) : (
          items.map((row) => (
            <PageNotificationRow
              key={row.id}
              row={row}
              busyId={busySingleId}
              onActivate={onRowActivate}
            />
          ))
        )}
      </div>

      {totalPages > 1 && !listQuery.isPending ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
          <p className="text-sm text-muted-foreground">{pagerLabel}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="tabular-nums text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
