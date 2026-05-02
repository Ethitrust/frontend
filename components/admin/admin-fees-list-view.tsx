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

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>Fees</h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Platform fee postings linked to escrows and orgs, plus reconcile rollups by currency.
        </p>
      </header>

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

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ledger rows</CardTitle>
          <CardDescription>Page {page}.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fee rows on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Escrow</TableHead>
                    <TableHead>Org</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminFeeRow[]).map((row) => {
                    const cur = row.currency ?? 'ETB'
                    const amt =
                      row.amount !== undefined && row.amount !== null
                        ? formatEscrowMoney(row.amount, cur)
                        : '—'
                    return (
                      <TableRow key={row.fee_id}>
                        <TableCell className="break-all font-mono text-[11px]">{row.fee_id}</TableCell>
                        <TableCell className="text-sm">{row.fee_type ?? '—'}</TableCell>
                        <TableCell className="text-sm">{amt}</TableCell>
                        <TableCell className="text-xs">{row.paid_by ?? '—'}</TableCell>
                        <TableCell className="font-mono text-[11px]">
                          {row.escrow_id ? (
                            <Link
                              href={`/admin/escrows/${encodeURIComponent(row.escrow_id)}`}
                              className="break-all underline-offset-4 hover:underline"
                            >
                              Escrow
                            </Link>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="break-all font-mono text-[11px]">{row.org_id ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status ?? '—'}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
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
