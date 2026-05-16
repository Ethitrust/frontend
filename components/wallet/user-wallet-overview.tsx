'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CircleDollarSign,
  History,
  Landmark,
  Lock,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

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
import { useKycGuard } from '@/components/kyc/kyc-guard-provider'
import type { WalletRow } from '@/lib/wallets/wallet-types'

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

function statusTone(status: string) {
  const s = status.toLowerCase()
  if (s === 'active') return 'secondary' as const
  if (s === 'locked' || s === 'suspended') return 'destructive' as const
  return 'outline' as const
}

function sumWallets(wallets: WalletRow[] | undefined, field: 'balance' | 'locked_balance') {
  return wallets?.reduce((sum, wallet) => sum + wallet[field], 0) ?? 0
}

function primaryCurrency(wallets: WalletRow[] | undefined) {
  if (!wallets?.length) return 'ETB'
  return wallets.find((w) => w.currency === 'ETB')?.currency ?? wallets[0]!.currency
}

function WalletStat({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: typeof Wallet
  label: string
  value: string
  description: string
  tone?: 'warm' | 'good'
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start gap-3 p-5">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/35',
            tone === 'warm' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300' : '',
            tone === 'good' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300' : '',
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function WalletAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: typeof Wallet
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-28 items-start justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex min-w-0 gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/35 text-muted-foreground transition-colors group-hover:text-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  )
}

export function UserWalletOverview() {
  const e = ethitrustThemeTokens
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { isKycVerified, isKycLoading } = useKycGuard()

  const walletsQuery = useQuery({
    queryKey: ['me', 'wallets'],
    queryFn: () => fetchMeWalletList(accessToken!),
    enabled: Boolean(accessToken),
  })

  const wallets = walletsQuery.data
  const currency = primaryCurrency(wallets)
  const availableTotal = sumWallets(wallets, 'balance')
  const lockedTotal = sumWallets(wallets, 'locked_balance')
  const walletCount = wallets?.length ?? 0
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
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Payments</p>
          <div className="mt-2 flex items-center gap-3">
            <h1 className={cn(e.typography.displayLG, 'font-serif font-normal text-foreground')}>
              ETB Wallet
            </h1>
            {!isKycVerified && !isKycLoading && (
              <Badge
                variant="outline"
                className="h-6 gap-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400"
              >
                <Lock className="size-3" />
                Verification Required
              </Badge>
            )}
          </div>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>
            Track spendable balance, escrow locks, payouts, and payment history from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={walletsQuery.isFetching}
            onClick={() => {
              void walletsQuery.refetch()
              void txsQuery.refetch()
            }}
          >
            <RefreshCw className={cn('size-4', walletsQuery.isFetching ? 'animate-spin' : '')} aria-hidden />
            Refresh
          </Button>
          <Button asChild className="rounded-full" disabled={!isKycVerified}>
            <Link href={isKycVerified ? "/wallet/deposit" : "#"}>
              <ArrowDownToLine className="size-4" aria-hidden />
              Deposit
            </Link>
          </Button>
        </div>
      </header>

      <div className="relative mt-10">
        <div
          className={cn(
            'transition-all duration-500',
            !isKycVerified && !isKycLoading && 'pointer-events-none select-none opacity-30 blur-[2px]',
          )}
        >
          {walletsQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not load wallets</AlertTitle>
              <AlertDescription>
                {walletsQuery.error instanceof Error ? walletsQuery.error.message : 'Request failed'}
              </AlertDescription>
            </Alert>
          ) : null}

          {walletsQuery.isPending ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-72 rounded-xl lg:col-span-2" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
          ) : !walletsQuery.data ? null : walletsQuery.data.length === 0 ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">No wallets</CardTitle>
                <CardDescription>
                  No wallet is attached to your profile yet. If you expected to see one, please contact support after any
                  pending verification is complete.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-4 lg:grid-cols-3" aria-label="Wallet summary">
                <WalletStat
                  icon={Wallet}
                  label="Available balance"
                  value={formatEscrowMoney(availableTotal, currency)}
                  description={walletCount === 1 ? 'Ready to fund escrows or withdraw.' : `Across ${walletCount} wallets.`}
                  tone="good"
                />
                <WalletStat
                  icon={Lock}
                  label="Locked in escrow"
                  value={formatEscrowMoney(lockedTotal, currency)}
                  description="Funds reserved for active escrow commitments."
                  tone="warm"
                />
                <WalletStat
                  icon={ShieldCheck}
                  label="Wallet status"
                  value={walletsQuery.data.every((w) => w.status.toLowerCase() === 'active') ? 'Active' : 'Review'}
                  description="Status is checked before deposits and payouts run."
                />
              </section>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
                <Card className="overflow-hidden shadow-sm">
                  <CardHeader className="border-b bg-muted/20">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <Landmark className="size-4 text-muted-foreground" aria-hidden />
                          Balances
                        </CardTitle>
                        <CardDescription className="mt-2">Spendable and reserved balances by wallet.</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {walletCount} wallet{walletCount === 1 ? '' : 's'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {walletsQuery.data.map((w) => (
                        <div key={w.id} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{w.currency} wallet</p>
                              <Badge variant={statusTone(w.status)} className="capitalize">
                                {w.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{w.id}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Updated {formatEscrowDateTime(w.updated_at)}
                            </p>
                          </div>
                          <dl className="grid min-w-64 grid-cols-2 gap-4 rounded-xl border bg-background p-4">
                            <div>
                              <dt className="text-xs font-medium text-muted-foreground">Available</dt>
                              <dd className="mt-1 font-semibold tabular-nums">
                                {formatEscrowMoney(w.balance, w.currency)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-muted-foreground">Locked</dt>
                              <dd className="mt-1 font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                                {formatEscrowMoney(w.locked_balance, w.currency)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid content-start gap-3">
                  <WalletAction
                    href="/wallet/deposit"
                    icon={ArrowDownToLine}
                    title="Deposit funds"
                    description="Add money through hosted checkout and return when payment clears."
                  />
                  <WalletAction
                    href="/wallet/withdraw"
                    icon={ArrowUpFromLine}
                    title="Withdraw"
                    description="Send available balance to a supported bank account."
                  />
                  <WalletAction
                    href="/wallet/transactions"
                    icon={History}
                    title="Full ledger"
                    description="Search deposits, withdrawals, fees, escrow releases, and reversals."
                  />
                </div>
              </section>

              {accessToken && activityWalletId && wallets && wallets.length > 0 ? (
                <Card className="overflow-hidden shadow-sm">
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
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                        <CircleDollarSign className="size-10 text-muted-foreground" aria-hidden />
                        <p className="mt-3 text-sm font-medium">No transactions yet</p>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                          Deposits, withdrawals, escrow holds, and releases will appear here.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border rounded-xl border">
                        {txsQuery.data.items.map((t) => (
                          <li key={t.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                                {t.amount >= 0 ? (
                                  <ArrowDownToLine
                                    className="size-4 text-emerald-700 dark:text-emerald-400"
                                    aria-hidden
                                  />
                                ) : (
                                  <ArrowUpFromLine className="size-4 text-muted-foreground" aria-hidden />
                                )}
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium">{transactionLabel(t.type)}</span>
                                  <Badge
                                    variant={txnStatusVariant(t.status)}
                                    className="text-[10px] font-normal capitalize"
                                  >
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
          )}
        </div>

        {!isKycVerified && !isKycLoading && accessToken && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
            <Card className="max-w-md -translate-y-75 animate-in fade-in zoom-in border-none bg-background shadow-2xl rounded-2xl overflow-hidden duration-300">
              <CardHeader className="pb-2 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="size-6" />
                </div>
                <CardTitle className="text-2xl font-semibold">Activate Your Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  In compliance with national financial regulations, identity verification is mandatory before
                  depositing funds or initiating escrow transactions.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    className="h-11 w-full rounded-full text-sm font-medium transition-transform active:scale-[0.98]"
                    onClick={() => router.push('/kyc')}
                  >
                    Start Verification (2 Mins)
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-11 w-full rounded-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => router.push('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

