'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  ClipboardList,
  FileStack,
  Gavel,
  LayoutDashboard,
  Radio,
  Scale,
  Settings2,
  ShieldAlert,
  Users,
  WalletCards,
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchAdminDisputeTotal,
  fetchAdminEscrowTotal,
  fetchAdminFeesReconcile,
  fetchAdminPipelineDiagnostics,
  fetchAdminRiskFlagTotal,
  fetchAdminUserTotal,
} from '@/lib/admin/admin-dashboard-api'
import { fetchAuthMe } from '@/lib/auth/me-session-api'
import { isPlatformAdminRole } from '@/lib/auth/roles'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

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

function StatLinkCard({
  href,
  icon: Icon,
  label,
  value,
  pending,
  error,
  description,
}: {
  href: string
  icon: LucideIcon
  label: string
  value: number | null
  pending: boolean
  error: boolean
  description: string
}) {
  const e = ethitrustThemeTokens
  const display =
    pending ? '…' : error ? '—' : value !== null ? value.toLocaleString() : '—'
  const tone = error ? 'text-muted-foreground' : 'text-foreground'
  return (
    <Card className="shadow-sm transition-colors hover:bg-muted/30">
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">{label}</CardTitle>
          <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent>
          <p className={cn(e.typography.displayLG, 'font-serif text-3xl tracking-tight', tone)}>
            {display}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Open
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </CardContent>
      </Link>
    </Card>
  )
}

const ADMIN_DESTINATIONS = [
  {
    href: '/admin/users',
    label: 'Users',
    Icon: Users,
    description: 'Directory, context, bans, risk resets',
  },
  {
    href: '/admin/kyc/review-queue',
    label: 'KYC review queue',
    Icon: ShieldAlert,
    description: 'Identity review backlog',
  },
  {
    href: '/admin/kyc/submissions',
    label: 'Manual KYC',
    Icon: FileStack,
    description: 'ID submissions & decisions',
  },
  {
    href: '/admin/organizations/applications',
    label: 'Org applications',
    Icon: Building2,
    description: 'Business license review',
  },
  {
    href: '/admin/escrows',
    label: 'Escrows',
    Icon: Scale,
    description: 'Platform escrows & tooling',
  },
  {
    href: '/admin/disputes',
    label: 'Disputes',
    Icon: Gavel,
    description: 'Threads & mediator actions',
  },
  {
    href: '/admin/transactions',
    label: 'Transactions',
    Icon: Activity,
    description: 'Money movement ledger',
  },
  {
    href: '/admin/wallets',
    label: 'Wallets',
    Icon: WalletCards,
    description: 'Balances & investigations',
  },
  {
    href: '/admin/notification-deliveries',
    label: 'Notification deliveries',
    Icon: Radio,
    description: 'Channels & retries',
  },
  {
    href: '/admin/events',
    label: 'Domain events',
    Icon: Activity,
    description: 'Outbox & delivery audit',
  },
  {
    href: '/admin/audit-logs',
    label: 'Audit log',
    Icon: ClipboardList,
    description: 'Immutable operator actions',
  },
  {
    href: '/admin/support-cases',
    label: 'Support cases',
    Icon: Users,
    description: 'Operator case queue',
  },
  {
    href: '/admin/settings',
    label: 'Platform settings',
    Icon: Settings2,
    description: 'Feature flags & config keys',
  },
] as const

export function AdminDashboardView() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const e = ethitrustThemeTokens

  const meQuery = useQuery({
    queryKey: ['me', 'auth', 'me'],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
  })

  useEffect(() => {
    if (meQuery.isSuccess && !isPlatformAdminRole(meQuery.data.role)) {
      router.replace('/dashboard')
    }
  }, [meQuery.isSuccess, meQuery.data?.role, router])

  const adminEnabled =
    Boolean(accessToken) &&
    meQuery.isSuccess &&
    Boolean(meQuery.data) &&
    isPlatformAdminRole(meQuery.data.role)

  const pipelineQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'pipeline-diagnostics'],
    queryFn: () => fetchAdminPipelineDiagnostics(accessToken!),
    enabled: adminEnabled,
    staleTime: 30_000,
  })

  const reconcileQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'fees-reconcile'],
    queryFn: () => fetchAdminFeesReconcile(accessToken!),
    enabled: adminEnabled,
    staleTime: 60_000,
  })

  const escrowTotalQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'totals', 'escrows'],
    queryFn: () => fetchAdminEscrowTotal(accessToken!),
    enabled: adminEnabled,
    staleTime: 30_000,
  })

  const disputeTotalQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'totals', 'disputes'],
    queryFn: () => fetchAdminDisputeTotal(accessToken!),
    enabled: adminEnabled,
    staleTime: 30_000,
  })

  const userTotalQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'totals', 'users'],
    queryFn: () => fetchAdminUserTotal(accessToken!),
    enabled: adminEnabled,
    staleTime: 30_000,
  })

  const riskFlagTotalQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'totals', 'risk-flags'],
    queryFn: () => fetchAdminRiskFlagTotal(accessToken!),
    enabled: adminEnabled,
    staleTime: 30_000,
  })

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-10')}>
        <Card className="mx-auto max-w-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Admin area</CardTitle>
            <CardDescription>Sign in with an operator account to open the admin dashboard.</CardDescription>
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

  if (meQuery.isPending) {
    return (
      <div className={cn(e.layout.container, 'space-y-4 py-8')}>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full max-w-2xl" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    )
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <div className={cn(e.layout.container, 'py-10')}>
        <Card className="mx-auto max-w-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Could not verify access</CardTitle>
            <CardDescription>{meQuery.error?.message ?? 'Try again from the workspace.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isPlatformAdminRole(meQuery.data.role)) {
    return (
      <div className={cn(e.layout.container, 'py-8')}>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    )
  }

  const pipeline = pipelineQuery.data
  const hasPipelineProblems =
    pipeline &&
    ((pipeline.failed_events ?? 0) > 0 || (pipeline.failed_deliveries ?? 0) > 0)

  const dashboardErrors = [
    pipelineQuery.error?.message,
    reconcileQuery.error?.message,
    escrowTotalQuery.error?.message,
    disputeTotalQuery.error?.message,
    userTotalQuery.error?.message,
    riskFlagTotalQuery.error?.message,
  ].filter(Boolean) as string[]

  const anyLoadingTotals =
    escrowTotalQuery.isPending ||
    disputeTotalQuery.isPending ||
    userTotalQuery.isPending ||
    riskFlagTotalQuery.isPending

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-10')}>
      <header className="max-w-3xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Admin</p>
        <h1
          className={cn(e.typography.displayLG, 'mt-2 flex items-center gap-3 font-serif font-normal text-foreground')}
        >
          <LayoutDashboard className="size-8 shrink-0 opacity-80" aria-hidden />
          Platform dashboard
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Signed in as {meQuery.data.name} ({meQuery.data.email}) — role{' '}
          <span className="font-medium text-foreground">{meQuery.data.role}</span>.
        </p>
      </header>

      {dashboardErrors.length > 0 ? (
        <Alert variant={dashboardErrors.some((m) => /403|forbidden/i.test(m)) ? 'destructive' : 'default'}>
          <AlertTriangle />
          <AlertTitle>Some admin data could not be loaded</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            {dashboardErrors.slice(0, 3).map((msg) => (
              <span key={msg} className="block text-sm">
                {msg}
              </span>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      <section aria-labelledby="admin-health-heading" className="space-y-3">
        <h2 id="admin-health-heading" className={cn(e.typography.eyebrow, 'text-muted-foreground')}>
          Health & pipeline
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold">Notification pipeline</CardTitle>
                {hasPipelineProblems ? (
                  <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
                ) : null}
              </div>
              <CardDescription>Event and delivery failures in the notification pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipelineQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-8 w-52" />
                </div>
              ) : pipelineQuery.isError ? (
                <p className="text-sm text-muted-foreground">Could not load diagnostics.</p>
              ) : (
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Failed events</dt>
                    <dd className="text-2xl font-semibold tabular-nums">
                      {(pipeline?.failed_events ?? 0).toLocaleString()}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Failed deliveries
                    </dt>
                    <dd className="text-2xl font-semibold tabular-nums">
                      {(pipeline?.failed_deliveries ?? 0).toLocaleString()}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Pending deliveries</dt>
                    <dd className="text-2xl font-semibold tabular-nums">
                      {(pipeline?.pending_deliveries ?? 0).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              )}
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/admin/notification-deliveries">Review deliveries</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Fee reconcile</CardTitle>
              <CardDescription>Collected and refunded platform fees by currency.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reconcileQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : reconcileQuery.isError ? (
                <p className="text-sm text-muted-foreground">Could not load fee reconcile.</p>
              ) : !reconcileQuery.data?.length ? (
                <p className="text-sm text-muted-foreground">No fee rows returned.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[280px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Currency</th>
                        <th className="px-3 py-2 font-medium">Collected</th>
                        <th className="px-3 py-2 font-medium">Refunded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconcileQuery.data.map((row) => (
                        <tr key={row.currency} className="border-b border-border last:border-b-0">
                          <td className="px-3 py-2 font-medium">{row.currency}</td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {formatMoney(row.collected_amount, row.currency)}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {formatMoney(row.refunded_amount, row.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/admin/fees">All fees</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="admin-queues-heading" className="space-y-3">
        <h2 id="admin-queues-heading" className={cn(e.typography.eyebrow, 'text-muted-foreground')}>
          Record totals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {anyLoadingTotals ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl border border-border" />
              ))}
            </>
          ) : (
            <>
              <StatLinkCard
                href="/admin/escrows"
                icon={Scale}
                label="Platform escrows"
                value={escrowTotalQuery.isError ? null : escrowTotalQuery.data ?? null}
                pending={false}
                error={escrowTotalQuery.isError}
                description="Tracked escrows visible to admins"
              />
              <StatLinkCard
                href="/admin/disputes"
                icon={Gavel}
                label="Disputes"
                value={disputeTotalQuery.isError ? null : disputeTotalQuery.data ?? null}
                pending={false}
                error={disputeTotalQuery.isError}
                description="Negotiation threads"
              />
              <StatLinkCard
                href="/admin/users"
                icon={Users}
                label="Users"
                value={userTotalQuery.isError ? null : userTotalQuery.data ?? null}
                pending={false}
                error={userTotalQuery.isError}
                description="Registered accounts directory"
              />
              <StatLinkCard
                href="/admin/risk-flags"
                icon={ShieldAlert}
                label="Risk flags"
                value={riskFlagTotalQuery.isError ? null : riskFlagTotalQuery.data ?? null}
                pending={false}
                error={riskFlagTotalQuery.isError}
                description="Compliance & manual review queue"
              />
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="admin-destinations-heading" className="space-y-3">
        <h2 id="admin-destinations-heading" className={cn(e.typography.eyebrow, 'text-muted-foreground')}>
          Workspace areas
        </h2>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Shortcuts</CardTitle>
            <CardDescription>Jump to other operator tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ADMIN_DESTINATIONS.map(({ href, label, Icon, description }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground transition-colors hover:bg-muted/60',
                    )}
                  >
                    <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-medium">{label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
