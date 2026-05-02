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
import type { AdminDisputeListRow } from '@/lib/admin/admin-api-types'
import { fetchAdminDisputes } from '@/lib/admin/admin-platform-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
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

export function AdminDisputesListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['admin', 'disputes', 'list', page, pageSize],
    queryFn: () => fetchAdminDisputes(accessToken, page, pageSize),
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
          Disputes
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Negotiations tied to escrows across the marketplace. Jump into the console for the thread,
          mediator tools, and actions.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load disputes</AlertTitle>
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
            <p className="text-sm text-muted-foreground">No disputes on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute</TableHead>
                    <TableHead>Escrow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminDisputeListRow[]).map((row) => (
                    <TableRow key={row.dispute_id}>
                      <TableCell className="align-top">
                        <div className="font-mono text-[11px] text-muted-foreground break-all">
                          {row.dispute_id}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.reason}</div>
                      </TableCell>
                      <TableCell className="align-top font-mono text-xs">
                        <Link
                          href={`/admin/escrows/${encodeURIComponent(row.escrow_id ?? '')}`}
                          className="break-all underline-offset-4 hover:underline"
                        >
                          {row.escrow_id ? `${row.escrow_id.slice(0, 8)}…` : '—'}
                        </Link>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline">{row.status ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[160px] align-top font-mono text-[10px] text-muted-foreground break-all">
                        Buy {row.buyer_id?.slice(0, 6)} Sell {row.seller_id?.slice(0, 6)}
                      </TableCell>
                      <TableCell className="align-top text-xs tabular-nums text-muted-foreground">
                        Msg {row.message_count ?? 0} · Ev {row.evidence_count ?? 0}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap text-xs text-muted-foreground">
                        {dt(row.negotiation_deadline_at)}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <Button size="sm" variant="outline" className="rounded-full" asChild>
                          <Link href={`/admin/disputes/${encodeURIComponent(row.dispute_id)}`}>
                            Console
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
