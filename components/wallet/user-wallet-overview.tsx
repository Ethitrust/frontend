'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, History, Landmark, Lock, Wallet } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEscrowDateTime, formatEscrowMoney } from '@/lib/escrows/format-escrow'
import { fetchMeWalletList, fetchMeWalletTransactions } from '@/lib/wallets/me-wallet-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

function transactionLabel(type: string) {
  const t = type.replace(/_/g, ' ')
  return t.length > 0 ? t.charAt(0).toUpperCase() + t.slice(1) : type
}

function txnStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status.toLowerCase()
  if (s === 'completed' || s === 'success' || s === 'successful') return 'secondary'
  if (s === 'failed' || s === 'rejected' || s === 'cancelled') return 'destructive'
  if (s === 'pending') return 'outline'
  return 'default'
}

export function UserWalletOverview() {
  const e = ethitrustThemeTokens
  const accessToken = useAuthStore((s) => s.accessToken)

  const walletsQuery = useQuery({
    queryKey: ['me', 'wallets'],
    queryFn: () => fetchMeWalletList(accessToken!),
    enabled: Boolean(accessToken),
  })

  const wallets = walletsQuery.data
  const activityWalletId = useMemo(() => {
    if (!wallets?.length) return null
    const etb = wallets.find((w) => w.currency === 'ETB')
    return (etb ?? wallets[0])?.id ?? null
  }, [wallets])

  const activityCurrency = useMemo(() => {
    if (!wallets?.length || !activityWalletId) return null
    return wallets.find((w) => w.id === activityWalletId)?.currency ?? null
  }, [wallets, activityWalletId])

  const txsQuery = useQuery({
    queryKey: ['me', 'wallets', activityWalletId, 'transactions-preview'],
    queryFn: () =>
      fetchMeWalletTransactions(accessToken!, activityWalletId!, 1, 8),
    enabled: Boolean(accessToken && activityWalletId),
  })

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Payments</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Wallet
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>
            After you sign in you can view balances and recent ledger activity here.
          </p>
        </header>
        <Card className="mt-10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sign in to load your wallets</CardTitle>
            <CardDescription>
              Use the same account you registered with. You will see balances, deposits, withdrawals, and activity after
              signing in.
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
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Payments</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Wallet
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Manage available and locked balances, deposit and withdraw funds, and open your full ledger when you need
          more detail.
        </p>
      </header>

      {walletsQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load wallets</AlertTitle>
          <AlertDescription>
            {walletsQuery.error instanceof Error
              ? walletsQuery.error.message
              : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/wallet/deposit">
            <ArrowDownToLine className="size-4 opacity-70" aria-hidden />
            Deposit
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/wallet/withdraw">
            <ArrowUpFromLine className="size-4 opacity-70" aria-hidden />
            Withdraw
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/wallet/transactions">
            <History className="size-4 opacity-70" aria-hidden />
            Transaction history
          </Link>
        </Button>
      </section>

      {walletsQuery.isPending ? (
        <div className="mt-10 space-y-4">
          <Skeleton className="h-52 w-full max-w-xl rounded-xl" />
          <Skeleton className="h-40 w-full max-w-xl rounded-xl" />
        </div>
      ) : !walletsQuery.data ? null : walletsQuery.data.length === 0 ? (
        <Card className="mt-10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">No wallets</CardTitle>
            <CardDescription>
              No wallet is attached to your profile yet. If you expected to see one, please contact support after any
              pending verification is complete.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="mt-10 space-y-10">
          {walletsQuery.data.map((w) => (
            <Card key={w.id} className="shadow-sm">
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0 border-b">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Landmark className="size-4 text-muted-foreground" aria-hidden />
                    {w.currency} wallet
                  </CardTitle>
                  <CardDescription className="mt-2 font-mono text-[11px] break-all">{w.id}</CardDescription>
                </div>
                <Badge variant={w.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>{w.status}</Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Wallet className="size-3" aria-hidden />
                      Available
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums">
                      {formatEscrowMoney(w.balance, w.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Lock className="size-3" aria-hidden />
                      Locked
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {formatEscrowMoney(w.locked_balance, w.currency)}
                    </dd>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <dt className="text-xs font-medium text-muted-foreground">Updated</dt>
                    <dd className="mt-1 text-sm tabular-nums text-muted-foreground">{formatEscrowDateTime(w.updated_at)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {accessToken && activityWalletId && wallets && wallets.length > 0 ? (
        <Card className="mt-10 shadow-sm">
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 border-b space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <History className="size-4 text-muted-foreground" aria-hidden />
                Recent activity
              </CardTitle>
              <CardDescription className="mt-2">
                {wallets.length > 1
                  ? `Latest movements on your ${activityCurrency} wallet.`
                  : 'Latest movements on this wallet.'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 rounded-full text-muted-foreground" asChild>
              <Link href="/wallet/transactions" className="gap-1">
                View all
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {txsQuery.isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : txsQuery.isError ? (
              <p className="text-sm text-destructive">
                {txsQuery.error instanceof Error ? txsQuery.error.message : 'Could not load transactions'}
              </p>
            ) : !txsQuery.data?.items.length ? (
              <p className="text-sm text-muted-foreground">No transactions yet for this wallet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border">
                {txsQuery.data.items.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{transactionLabel(t.type)}</span>
                        <Badge variant={txnStatusVariant(t.status)} className="text-[10px] font-normal capitalize">
                          {t.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {t.description ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{t.description}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                        {formatEscrowDateTime(t.created_at)}
                        {t.reference ? ` · ref ${t.reference}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          t.amount >= 0 ? 'text-emerald-700 dark:text-emerald-400' : '',
                        )}
                      >
                        {t.amount >= 0 ? '+' : ''}
                        {formatEscrowMoney(t.amount, t.currency)}
                      </p>
                      {t.escrow_id ? (
                        <Link
                          href={`/escrows/${t.escrow_id}`}
                          className="text-xs text-primary underline-offset-4 hover:underline"
                        >
                          Escrow
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
