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
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import type { EscrowDisputeRow } from '@/lib/disputes/dispute-types'
import { fetchMeDisputes } from '@/lib/disputes/me-disputes-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function formatDisputeStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status.toLowerCase()
  if (
    s.includes('cancel') ||
    s.includes('reject') ||
    s.includes('failed') ||
    s.includes('escalated')
  ) {
    return 'destructive'
  }
  if (s.includes('pending') || s.includes('negotiation')) return 'outline'
  if (
    s.includes('resolved') ||
    s.includes('closed') ||
    s.includes('settled') ||
    s.includes('complete')
  )
    return 'secondary'
  return 'default'
}

export function DisputesListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['me', 'disputes', 'list', page, pageSize],
    queryFn: () => fetchMeDisputes(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const data = listQuery.data
  const totalPages =
    data && data.page_size > 0 ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  const items: EscrowDisputeRow[] = data?.items ?? []

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Trust</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Disputes
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Open negotiations tied to escrows stay here. Pick a dispute to join the secure thread, attach
          evidence, and propose or confirm settlements when both parties agree.
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
          <CardTitle className="text-base font-semibold">Your disputes</CardTitle>
          <CardDescription>
            Showing page {page} of {totalPages}.
            {data ? ` (${data.total} total)` : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No disputes yet. When a counterparty raises a concern on escrowed funds you will find it listed
              here.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Escrow</TableHead>
                    <TableHead className="hidden md:table-cell">Updated</TableHead>
                    <TableHead className="text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => {
                    const sid = typeof row.status === 'string' ? row.status : '—'
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="max-w-[220px]">
                          <div className="font-medium">{row.reason?.trim() || 'Dispute'}</div>
                          {row.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {row.description}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(sid)} className="whitespace-nowrap">
                            {formatDisputeStatus(sid)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs sm:table-cell">
                          {row.escrow_id ? (
                            <span className="max-w-[120px] truncate block" title={row.escrow_id}>
                              {row.escrow_id.slice(0, 8)}…
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground tabular-nums">
                          {row.updated_at ? formatEscrowDateTime(row.updated_at) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="rounded-full" asChild>
                            <Link href={`/disputes/${encodeURIComponent(row.id)}`}>Open</Link>
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
        {data && data.total > pageSize ? (
          <CardFooter className="flex justify-between gap-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page <= 1 || listQuery.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page >= totalPages || listQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  )
}
