'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminFeeRow } from '@/lib/admin/admin-api-types'
import { fetchAdminFees, fetchAdminFeesReconcile } from '@/lib/admin/admin-platform-api'
import { formatEscrowDateTime, formatEscrowMoney } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function dt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

function formatMoney(amount: number, currency: string) {
  try {
    return formatEscrowMoney(amount, currency)
  } catch {
    return `${amount} ${currency}`
  }
}

export function AdminFeesListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['admin', 'fees', 'list', page, pageSize],
    queryFn: () => fetchAdminFees(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const reconcileQuery = useQuery({
    queryKey: ['admin', 'fees', 'reconcile'],
    queryFn: () => fetchAdminFeesReconcile(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const stats = {
    totalCollected: reconcileQuery.data?.reduce((acc, r) => acc + r.collected_amount, 0) || 0,
    p2pRevenue: items.filter(i => i.fee_type === 'p2p' || i.fee_type === 'starter').reduce((acc, i) => acc + (i.amount || 0), 0),
    apiRevenue: items.filter(i => i.fee_type === 'api' || i.fee_type === 'business').reduce((acc, i) => acc + (i.amount || 0), 0),
    subscriptionRevenue: items.filter(i => i.fee_type === 'subscription').reduce((acc, i) => acc + (i.amount || 0), 0),
    transactionCount: items.length
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Monetization engine</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Revenue Dashboard
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>
            Comprehensive view of platform income across P2P transaction fees, Business API usage, and recurring subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live tracking</span>
        </div>
      </header>

      {/* Primary Revenue Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-primary/10 bg-primary/[0.02]">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Revenue (Page)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif">
              {listQuery.isPending ? '...' : (stats.p2pRevenue + stats.apiRevenue + stats.subscriptionRevenue).toLocaleString()} 
              <span className="ml-1 text-xs font-sans font-normal text-muted-foreground">ETB</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">P2P Fees (1.5%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif text-blue-600">
              {listQuery.isPending ? '...' : stats.p2pRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">API Usage (0.8%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif text-emerald-600">
              {listQuery.isPending ? '...' : stats.apiRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif text-purple-600">
              {listQuery.isPending ? '...' : stats.subscriptionRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load fees</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Fee reconcile</CardTitle>
          <CardDescription>Collected vs refunded by currency.</CardDescription>
        </CardHeader>
        <CardContent>
          {reconcileQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : reconcileQuery.isError ? (
            <p className="text-sm text-muted-foreground">Reconcile unavailable right now.</p>
          ) : !reconcileQuery.data?.length ? (
            <p className="text-sm text-muted-foreground">No reconcile rows returned.</p>
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
        </CardContent>
      </Card>

      <Card className="mt-8 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/5 border-b">
          <CardTitle className="text-base font-semibold">Financial Ledger</CardTitle>
          <CardDescription>Verified fee postings and automated reconciliation.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {listQuery.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No revenue records found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase tracking-wider">Reference</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Revenue</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Source</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminFeeRow[]).map((row) => {
                    const cur = row.currency ?? 'ETB'
                    const isRefund = row.status === 'refunded'
                    return (
                      <TableRow key={row.fee_id} className="group hover:bg-muted/20">
                        <TableCell className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                          {row.fee_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium capitalize">{row.fee_type || 'Platform'}</span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-sm font-semibold",
                            isRefund ? "text-orange-600" : "text-emerald-600"
                          )}>
                            {isRefund ? '-' : '+'}{row.amount?.toLocaleString()} {cur}
                          </span>
                        </TableCell>
                        <TableCell>
                          {row.escrow_id ? (
                            <Link
                              href={`/admin/escrows/${encodeURIComponent(row.escrow_id)}`}
                              className="text-[10px] font-medium text-primary hover:underline"
                            >
                              Escrow {row.escrow_id.slice(0, 8)}
                            </Link>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Platform Direct</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={isRefund ? "outline" : "default"}
                            className={cn(
                              "text-[9px] font-bold uppercase py-0 px-1.5 h-5",
                              !isRefund && "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none"
                            )}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[10px] text-muted-foreground italic">
                          {dt(row.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between gap-4 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous page
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next page
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
