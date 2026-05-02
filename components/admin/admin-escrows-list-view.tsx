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
import type { AdminEscrowListRow } from '@/lib/admin/admin-api-types'
import { fetchAdminEscrows } from '@/lib/admin/admin-platform-api'
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

export function AdminEscrowsListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['admin', 'escrows', 'list', page, pageSize],
    queryFn: () => fetchAdminEscrows(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Escrows
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Platform-wide escrows: parties, lifecycle status, and funding metadata. Open a console for probes
          and operator actions.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load escrows</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Overview</CardTitle>
          <CardDescription>Page {page}.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No escrows on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Escrow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminEscrowListRow[]).map((row) => {
                    const cur = row.currency ?? 'ETB'
                    const amt =
                      row.amount !== undefined && row.amount !== null
                        ? formatEscrowMoney(row.amount, cur)
                        : '—'
                    return (
                      <TableRow key={row.escrow_id}>
                        <TableCell>
                          <div className="font-medium">{row.title ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{row.escrow_type ?? '—'}</div>
                          <div className="mt-1 font-mono text-[11px] text-muted-foreground break-all">
                            {row.escrow_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status ?? '—'}</Badge>
                          <div className="mt-1 text-xs text-muted-foreground">{row.counter_status ?? ''}</div>
                        </TableCell>
                        <TableCell className="text-sm">{amt}</TableCell>
                        <TableCell className="max-w-[200px] text-xs font-mono break-all text-muted-foreground">
                          <div>I {row.initiator_id?.slice(0, 8)}…</div>
                          <div>R {row.receiver_id?.slice(0, 8)}…</div>
                          {row.organization_id ? (
                            <div>O {row.organization_id.slice(0, 8)}…</div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">
                          Δ{row.timeline_event_count ?? 0} · M{row.milestone_count ?? 0} · CO
                          {row.counter_offer_count ?? 0}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{dt(row.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="rounded-full" asChild>
                            <Link href={`/admin/escrows/${encodeURIComponent(row.escrow_id)}`}>
                              Console
                            </Link>
                          </Button>
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
