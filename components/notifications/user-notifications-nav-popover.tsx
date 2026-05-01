'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { BellIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useNotificationReadMutations } from '@/components/notifications/use-notification-read-mutations'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { fetchMeNotifications } from '@/lib/notifications/me-notifications-api'
import type { NotificationRow } from '@/lib/notifications/notification-types'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const PREVIEW_PAGE_SIZE = 12

function unreadBadgeLabel(count: number) {
  if (count <= 0) return null
  return count > 99 ? '99+' : String(count)
}

function NavNotificationRow({
  row,
  onActivate,
  busyId,
}: {
  row: NotificationRow
  onActivate: (id: string) => void
  busyId: string | null
}) {
  const busy = busyId === row.id

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onActivate(row.id)}
      className={cn(
        'flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-b-0',
        !row.is_read ? 'bg-muted/25' : 'hover:bg-muted/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 font-medium leading-snug">{row.title}</span>
        {!row.is_read ? <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" aria-hidden /> : null}
      </div>
      <span className="line-clamp-2 text-xs text-muted-foreground">{row.body}</span>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {formatEscrowDateTime(row.created_at)}
      </span>
      {busy ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Spinner className="size-3" aria-hidden /> Updating…
        </span>
      ) : null}
    </button>
  )
}

export function UserNotificationsNavPopover({ className }: { className?: string }) {
  const e = ethitrustThemeTokens
  const accessToken = useAuthStore((s) => s.accessToken)
  const { markRead, markAllRead } = useNotificationReadMutations(accessToken)

  const previewQuery = useQuery({
    queryKey: ['me', 'notifications', 'preview', PREVIEW_PAGE_SIZE],
    queryFn: () =>
      fetchMeNotifications(accessToken!, {
        page: 1,
        pageSize: PREVIEW_PAGE_SIZE,
        unreadOnly: false,
      }),
    enabled: Boolean(accessToken),
    staleTime: 45_000,
  })

  const items = previewQuery.data?.items ?? []
  const unreadCount = previewQuery.data?.unread_count ?? 0
  const badge = unreadBadgeLabel(unreadCount)

  function onRowActivate(notificationId: string) {
    const row = items.find((n) => n.id === notificationId)
    if (row?.is_read) return
    markRead.mutate([notificationId])
  }

  const vid = markRead.variables
  const busySingleId =
    markRead.isPending && Array.isArray(vid) && vid.length === 1 ? vid[0]! : null

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && accessToken) void previewQuery.refetch()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('relative rounded-full', className)}
          aria-label={`Notifications${badge ? ` (${unreadCount} unread)` : ''}`}
        >
          <BellIcon className="size-5" aria-hidden />
          {badge ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex min-w-[1.15rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground"
              aria-hidden
            >
              {badge}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="flex w-[min(440px,calc(100vw-1.25rem))] flex-col gap-0 overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg outline-hidden"
      >
        {!accessToken ? (
          <div className="px-5 py-6">
            <p className={cn(e.typography.bodyMuted)}>Sign in to load your inbox.</p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/signin">Sign in</Link>
            </Button>
          </div>
        ) : previewQuery.isError ? (
          <div className="px-5 py-6">
            <p className="text-sm font-medium text-destructive">Could not load notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {previewQuery.error instanceof Error ? previewQuery.error.message : 'Request failed'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => void previewQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Inbox</p>
                <p className="text-sm font-semibold text-foreground">Notifications</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-full text-xs"
                disabled={markAllRead.isPending || unreadCount === 0 || previewQuery.isPending}
                onClick={() => markAllRead.mutate()}
              >
                {markAllRead.isPending ? (
                  <>
                    <Spinner className="size-3" aria-hidden />
                    Marking…
                  </>
                ) : (
                  'Mark all read'
                )}
              </Button>
            </div>

            <ScrollArea className="max-h-[min(24rem,calc(100vh-10rem))]">
              <div role="feed" aria-label="Latest notifications">
                {previewQuery.isPending ? (
                  <div className="space-y-0 p-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="mb-3 h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className={cn(e.typography.bodyMuted, 'px-4 py-10 text-center text-sm')}>
                    Nothing yet. Funding, escrows, and disputes will generate entries here.
                  </p>
                ) : (
                  items.map((row) => (
                    <NavNotificationRow
                      key={row.id}
                      row={row}
                      busyId={busySingleId}
                      onActivate={onRowActivate}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            <Separator />
            <div className="p-2">
              <Button asChild variant="ghost" size="sm" className="h-10 w-full rounded-full text-sm">
                <Link href="/notifications">View full inbox</Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
