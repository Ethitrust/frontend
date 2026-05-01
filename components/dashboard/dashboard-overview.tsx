'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Handshake,
  Landmark,
  Mail,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EscrowPreviewClickableRow } from '@/components/escrows/clickable-escrow-row'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAuthMe, fetchAuthProfile } from '@/lib/auth/me-session-api'
import type { EscrowDisputeRow } from '@/lib/disputes/dispute-types'
import { fetchMeDisputes } from '@/lib/disputes/me-disputes-api'
import { fetchMeEscrows } from '@/lib/escrows/me-escrows-api'
import type { EscrowListItem, PaginatedEscrowsList } from '@/lib/escrows/escrow-list-types'
import { isKycCompleted, presentKycStatus } from '@/lib/kyc/kyc-presentation'
import type { PaginatedNotifications, NotificationRow } from '@/lib/notifications/notification-types'
import { fetchMeNotifications } from '@/lib/notifications/me-notifications-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { fetchMeWalletList, fetchMeWalletTransactions, pickDefaultWalletId } from '@/lib/wallets/me-wallet-api'
import type { WalletRow, WalletTransactionItem } from '@/lib/wallets/wallet-types'

const ACTIVE_ESCROW_STATUSES = new Set([
  'active',
  'invited',
  'pending_funding',
  'pending_acceptance',
])

const ESCROW_SNAPSHOT_PAGE_SIZE = 50
const ESCROW_PREVIEW_ROWS = 6

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString()} ${currency}`
  }
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function escrowStatusPresentation(status: string) {
  const s = status.replace(/_/g, ' ')
  const variant =
    status === 'active'
      ? 'secondary'
      : status === 'completed'
        ? 'outline'
        : status === 'invited'
          ? 'outline'
          : 'default'
  return { label: s.charAt(0).toUpperCase() + s.slice(1), variant } as const
}

function pickPrimaryWalletStats(wallets: WalletRow[]): {
  balance: number
  locked_balance: number
  currency: string
} {
  const id = pickDefaultWalletId(wallets)
  const primary = wallets.find((w) => w.id === id) ?? wallets[0]
  if (!primary)
    return { balance: 0, locked_balance: 0, currency: 'ETB' }
  return {
    balance: primary.balance,
    locked_balance: primary.locked_balance,
    currency: primary.currency,
  }
}

function countActiveAmong(items: EscrowListItem[]) {
  return items.filter((e) => ACTIVE_ESCROW_STATUSES.has(e.status)).length
}

function disputeNeedsAttention(d: EscrowDisputeRow) {
  const s = (d.status ?? '').toLowerCase()
  if (!s) return false
  return !/resolved|closed|cancel|canceled|settled|completed/.test(s)
}

function ledgerLabelForTxn(t: WalletTransactionItem) {
  const raw = String(t.type || 'transaction').replace(/_/g, ' ')
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Transaction'
}

export type DashboardActivity = {
  id: string
  label: string
  detail: string
  at: string
  href: string
}

function buildActivityFeed(
  notifications: NotificationRow[],
  transactions: WalletTransactionItem[],
): DashboardActivity[] {
  const notifActs: DashboardActivity[] = notifications.map((n) => ({
    id: `n-${n.id}`,
    label: n.title.trim() || 'Notification',
    detail: (n.body || '').slice(0, 160),
    at: n.created_at,
    href: '/notifications',
  }))

  const txnActs: DashboardActivity[] = transactions.map((t) => {
    const escrow = typeof t.escrow_id === 'string' && t.escrow_id.length > 0
    const href = escrow ? `/escrows/${encodeURIComponent(t.escrow_id!)}` : '/wallet/transactions'
    const amt = `${t.currency} ${t.amount.toLocaleString()}`
    return {
      id: `tx-${t.id}`,
      label: ledgerLabelForTxn(t),
      detail:
        typeof t.description === 'string' && t.description.trim()
          ? t.description.trim().slice(0, 140)
          : `${amt}${t.reference ? ` · ${t.reference}` : ''}`,
      at: t.created_at,
      href,
    }
  })

  const merged = [...notifActs, ...txnActs]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10)

  return merged
}

function statsLoadWarning(
  escrows: PaginatedEscrowsList | undefined,
): { activeCount: number; note: string | null } {
  if (!escrows) return { activeCount: 0, note: null }
  const chunk = escrows.items
  const activeCount = countActiveAmong(chunk)
  if (!chunk.length && escrows.total === 0)
    return { activeCount: 0, note: null }
  if (chunk.length >= escrows.total)
    return { activeCount, note: null }
  return {
    activeCount,
    note: `${escrows.total} escrows overall — counting active among the first ${chunk.length} fetched.`,
  }
}

export function DashboardOverview() {
  const e = ethitrustThemeTokens
  const accessToken = useAuthStore((s) => s.accessToken)

  const [meQuery, profileQuery] = useQueries({
    queries: [
      {
        queryKey: ['me', 'auth', 'me'],
        queryFn: () => fetchAuthMe(accessToken!),
        enabled: Boolean(accessToken),
      },
      {
        queryKey: ['me', 'auth', 'profile'],
        queryFn: () => fetchAuthProfile(accessToken!),
        enabled: Boolean(accessToken),
      },
    ],
  })

  const walletsQuery = useQuery({
    queryKey: ['me', 'wallets'],
    queryFn: () => fetchMeWalletList(accessToken!),
    enabled: Boolean(accessToken),
  })

  const escrowsQuery = useQuery({
    queryKey: ['me', 'escrows', 'dashboard', ESCROW_SNAPSHOT_PAGE_SIZE],
    queryFn: () => fetchMeEscrows(accessToken!, 1, ESCROW_SNAPSHOT_PAGE_SIZE),
    enabled: Boolean(accessToken),
  })

  const disputesQuery = useQuery({
    queryKey: ['me', 'disputes', 'dashboard', 'page1'],
    queryFn: () => fetchMeDisputes(accessToken!, 1, 25),
    enabled: Boolean(accessToken),
  })

  const notificationsQuery = useQuery({
    queryKey: ['me', 'notifications', 'preview', 12],
    queryFn: () =>
      fetchMeNotifications(accessToken!, {
        page: 1,
        pageSize: 12,
        unreadOnly: false,
      }),
    enabled: Boolean(accessToken),
  })

  const preferredWalletId = useMemo(
    () =>
      walletsQuery.data?.length ? pickDefaultWalletId(walletsQuery.data) ?? null : null,
    [walletsQuery.data],
  )

  const walletTxQuery = useQuery({
    queryKey: ['me', 'wallets', preferredWalletId, 'recent-tx-dashboard'],
    queryFn: () => fetchMeWalletTransactions(accessToken!, preferredWalletId!, 1, 8),
    enabled: Boolean(accessToken && preferredWalletId && walletsQuery.isSuccess),
  })

  const sessionSuccess = Boolean(accessToken && meQuery.isSuccess && profileQuery.isSuccess)
  const sessionPending = Boolean(accessToken && (meQuery.isPending || profileQuery.isPending))
  const sessionErrored = Boolean(
    accessToken && !sessionPending && (meQuery.isError || profileQuery.isError),
  )

  const displayMe = sessionSuccess ? meQuery.data : null
  const displayProfile = sessionSuccess ? profileQuery.data : null

  const kycDone = displayProfile ? isKycCompleted(displayProfile.kyc_status) : false

  const greetingFirst = displayProfile?.first_name?.trim() ||
    displayMe?.name?.split(/\s+/)[0] ||
    'there'

  const qErr =
    ([meQuery, profileQuery].find((x) => x.error)?.error as Error | undefined)?.message ?? ''

  const disputeAlert = disputesQuery.data?.items.find((d) => disputeNeedsAttention(d))

  const statsFromWallet =
    walletsQuery.data && walletsQuery.data.length ? pickPrimaryWalletStats(walletsQuery.data) : null

  const { activeCount, note: escrowStatNote } = statsLoadWarning(escrowsQuery.data)

  const escrowPreviewRows: EscrowListItem[] =
    escrowsQuery.data?.items.slice(0, ESCROW_PREVIEW_ROWS) ?? []

  const notifEnvelope: PaginatedNotifications | undefined = notificationsQuery.data
  const notifPreview: NotificationRow[] = notifEnvelope?.items.slice(0, 6) ?? []
  const unreadNotifications = typeof notifEnvelope?.unread_count === 'number' ? notifEnvelope.unread_count : 0

  const activityFeed = buildActivityFeed(
    notificationsQuery.data?.items ?? [],
    walletTxQuery.data?.items ?? [],
  )

  const showActivitySkeleton =
    activityFeed.length === 0 &&
    (notificationsQuery.isPending ||
      (Boolean(preferredWalletId) && walletTxQuery.isPending))

  const dataSectionErrors = [
    walletsQuery.error && `Wallet: ${(walletsQuery.error as Error).message}`,
    escrowsQuery.error && `Escrows: ${(escrowsQuery.error as Error).message}`,
    disputesQuery.error && `Disputes: ${(disputesQuery.error as Error).message}`,
    notificationsQuery.error &&
      `Notifications: ${(notificationsQuery.error as Error).message}`,
    walletTxQuery.error &&
      walletsQuery.data &&
      walletsQuery.data.length > 0 &&
      `Activity: ${(walletTxQuery.error as Error).message}`,
  ].filter(Boolean) as string[]

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <header className="max-w-3xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Workspace</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Your dashboard
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3 max-w-xl')}>
            Sign in to sync wallet balances, escrows you participate in, team invites, and in-app notices.
          </p>
        </header>
        <Card className="mt-10 max-w-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Continue to Ethi-Trust</CardTitle>
            <CardDescription>
              Protected workspace data stays server-side linked to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full">
              <Link href="/signin">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-3xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Workspace</p>
        {sessionPending ? (
          <Skeleton className="mt-4 h-10 max-w-lg rounded-lg" aria-hidden />
        ) : (
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Welcome back, {greetingFirst}
          </h1>
        )}
        <p className={cn(e.typography.bodyMuted, 'mt-3 max-w-xl')}>
          Your wallet, active escrows, and latest updates in one place — loaded from live account data when the API
          is reachable.
        </p>
      </header>

      {sessionErrored ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load your session profile</AlertTitle>
          <AlertDescription>
            {qErr.length > 0 ? qErr : 'Request failed'}. Open Compliance (KYC) or sign out and sign in again to
            retry.
          </AlertDescription>
        </Alert>
      ) : null}

      {sessionSuccess && displayMe && displayProfile ? (
        <>
          {!displayMe.email_verified ? (
            <Alert className="mt-8 border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <Mail aria-hidden />
              <AlertTitle>Verify your email</AlertTitle>
              <AlertDescription>
                Some actions stay limited until your email is confirmed. Check your inbox for the Ethi-Trust
                verification link.
              </AlertDescription>
            </Alert>
          ) : null}

          {!kycDone ? (
            <Alert className="mt-8 border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <ShieldCheck aria-hidden />
              <AlertTitle>Complete identity verification</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                <span>KYC is required before you can accept escrows or move certain funds.</span>
                <Button size="sm" className="rounded-full" asChild>
                  <Link href="/kyc">Continue KYC</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
        </>
      ) : null}

      {dataSectionErrors.length > 0 ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Some dashboard data did not load</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {dataSectionErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {disputeAlert ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTriangle aria-hidden />
          <AlertTitle>Open dispute needs attention</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>
              {disputeAlert.reason?.trim() || 'Active dispute'} — status{' '}
              <span className="font-medium">
                {(disputeAlert.status ?? 'open').replace(/_/g, ' ')}
              </span>
              .
            </span>
            <Button size="sm" variant="secondary" className="rounded-full" asChild>
              <Link href={`/disputes/${encodeURIComponent(disputeAlert.id)}`}>Open dispute room</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary stats">
        <Card className="gap-4 py-5 shadow-sm">
          <CardHeader className="px-5 pb-0">
            <CardDescription>Wallet balance</CardDescription>
            {walletsQuery.isPending ? (
              <Skeleton className="mt-3 h-9 w-40 rounded-lg" aria-hidden />
            ) : (
              <CardTitle className="font-serif text-2xl font-normal tracking-tight">
                {statsFromWallet
                  ? formatMoney(statsFromWallet.balance, statsFromWallet.currency)
                  : formatMoney(0, 'ETB')}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="px-5 pt-0">
            <p className="text-sm text-muted-foreground">
              {statsFromWallet
                ? `${formatMoney(statsFromWallet.locked_balance, statsFromWallet.currency)} held in active escrows`
                : 'No wallets returned yet'}
            </p>
            <Button variant="link" className="mt-1 h-auto px-0 text-accent-foreground" asChild>
              <Link href="/wallet">
                Wallet details <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="gap-4 py-5 shadow-sm">
          <CardHeader className="px-5 pb-0">
            <CardDescription>Active escrows</CardDescription>
            {escrowsQuery.isPending ? (
              <Skeleton className="mt-3 h-9 w-12 rounded-lg" aria-hidden />
            ) : (
              <CardTitle className="font-serif text-2xl font-normal tracking-tight">{activeCount}</CardTitle>
            )}
          </CardHeader>
          <CardContent className="px-5 pt-0">
            <p className="text-sm text-muted-foreground">
              {escrowStatNote ?? `${escrowsQuery.data?.total ?? 0} total escrow records`}
            </p>
            <Button variant="link" className="mt-1 h-auto px-0 text-accent-foreground" asChild>
              <Link href="/escrows">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="gap-4 py-5 shadow-sm">
          <CardHeader className="px-5 pb-0">
            <CardDescription>Unread notifications</CardDescription>
            {notificationsQuery.isPending ? (
              <Skeleton className="mt-3 h-9 w-12 rounded-lg" aria-hidden />
            ) : (
              <CardTitle className="font-serif text-2xl font-normal tracking-tight">{unreadNotifications}</CardTitle>
            )}
          </CardHeader>
          <CardContent className="px-5 pt-0">
            <p className="text-sm text-muted-foreground">
              {(notifEnvelope?.total ?? 0).toLocaleString()} messages in inbox
            </p>
            <Button variant="link" className="mt-1 h-auto px-0 text-accent-foreground" asChild>
              <Link href="/notifications">
                Notification center <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="gap-4 py-5 shadow-sm">
          <CardHeader className="px-5 pb-0">
            <CardDescription>Trust profile</CardDescription>
            {sessionPending || !displayProfile ? (
              <Skeleton className="mt-3 h-8 w-40 rounded-lg" aria-hidden />
            ) : (
              <CardTitle className="font-serif text-xl font-normal tracking-tight capitalize">
                {presentKycStatus(displayProfile.kyc_status).label.toLowerCase()}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="px-5 pt-0">
            {sessionPending || !displayMe ? (
              <Skeleton className="mt-3 h-4 w-full max-w-56" aria-hidden />
            ) : (
              <p className="text-sm text-muted-foreground">
                {displayMe.two_factor_enabled ? '2FA on' : '2FA off'} · Email{' '}
                {displayMe.email_verified ? 'verified' : 'pending'}
              </p>
            )}
            <Button variant="link" className="mt-1 h-auto px-0 text-accent-foreground" asChild>
              <Link href="/kyc">
                KYC & documents <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-10" aria-label="Quick actions">
        <h2 className={cn(e.typography.statLabel, 'mb-3')}>Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" asChild>
            <Link href="/escrows/new">
              <PlusCircle />
              New escrow
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full bg-background/60" asChild>
            <Link href="/wallet/deposit">
              <Landmark />
              Deposit
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full bg-background/60" asChild>
            <Link href="/wallet/withdraw">
              <Landmark />
              Withdraw
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full bg-background/60" asChild>
            <Link href="/organizations/apply">
              <Building2 />
              Apply as business
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full bg-background/60" asChild>
            <Link href="/org-invites">
              <Mail />
              Org invites
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <Card className="gap-0 py-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b px-6 py-5">
            <div>
              <CardTitle className="font-semibold">Escrows</CardTitle>
              <CardDescription>Recent listings you participate in</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href="/escrows">
                <Handshake />
                All escrows
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-2 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-xl text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {escrowsQuery.isPending ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="border-b border-border/60">
                        <td className="px-6 py-3">
                          <Skeleton className="h-5 w-48 rounded" />
                          <Skeleton className="mt-2 h-3 w-32 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-24 rounded" />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Skeleton className="ml-auto h-4 w-24 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : escrowPreviewRows.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-muted-foreground" colSpan={4}>
                        No escrows yet.{' '}
                        <Link href="/escrows/new" className="font-medium text-accent-foreground underline">
                          Create one
                        </Link>
                        .
                      </td>
                    </tr>
                  ) : (
                    escrowPreviewRows.map((row) => {
                      const st = escrowStatusPresentation(row.status)
                      return (
                        <EscrowPreviewClickableRow
                          key={row.id}
                          row={row}
                          statusBadgeVariant={st.variant}
                          statusBadgeLabel={st.label}
                        />
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="gap-0 py-0 shadow-sm">
            <CardHeader className="border-b px-6 py-5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="font-semibold">Notifications</CardTitle>
                <Bell className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <CardDescription>Newest inbox items ({notifEnvelope?.total ?? 0})</CardDescription>
            </CardHeader>
            <CardContent className="divide-y px-0 pb-1 pt-0">
              {notificationsQuery.isPending ? (
                <div className="space-y-3 px-6 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full max-w-sm rounded" />
                      <Skeleton className="h-3 w-full rounded" />
                    </div>
                  ))}
                </div>
              ) : !notifPreview.length ? (
                <p className="px-6 py-8 text-sm text-muted-foreground">Nothing in inbox yet.</p>
              ) : (
                notifPreview.map((n) => (
                  <div key={n.id} className="px-6 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      {!n.is_read ? (
                        <span className="size-2 shrink-0 rounded-full bg-accent" title="Unread" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatShortDate(n.created_at)}</p>
                  </div>
                ))
              )}
              <div className="px-6 py-3">
                <Button variant="ghost" size="sm" className="w-full rounded-full" asChild>
                  <Link href="/notifications">View all notifications</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 shadow-sm">
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="font-semibold">Recent activity</CardTitle>
              <CardDescription>Notifications + recent wallet movements</CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-4">
              {showActivitySkeleton ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : activityFeed.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent activity. Fund your wallet or accept an escrow to generate entries.
                </p>
              ) : (
                <ul className="space-y-4">
                  {activityFeed.map((item) => (
                    <li key={item.id} className="flex gap-3 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-muted-foreground line-clamp-2">{item.detail}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatShortDate(item.at)}</p>
                        <Link
                          href={item.href}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent-foreground hover:underline"
                        >
                          View <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
