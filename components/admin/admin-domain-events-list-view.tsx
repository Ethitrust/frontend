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
import type { AdminDomainEventListRow } from '@/lib/admin/admin-api-types'
import { fetchAdminDomainEvents } from '@/lib/admin/admin-messaging-audit-api'
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

function clip(s?: string | null, max = 80) {
  if (!s) return ''
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export function AdminDomainEventsListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['admin', 'domain-events', 'list', page, pageSize],
    queryFn: () => fetchAdminDomainEvents(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Messaging & audits</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Domain events
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Outbox-style aggregates and delivery telemetry. Open an event when you need serialized payload proof.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load events</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Stream</CardTitle>
          <CardDescription>Page {page}.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rows on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keys</TableHead>
                    <TableHead>Aggregate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Occurrence</TableHead>
                    <TableHead>Last error</TableHead>
                    <TableHead className="text-right">Payload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminDomainEventListRow[]).map((row) => (
                    <TableRow key={row.event_id}>
                      <TableCell className="max-w-48 text-sm wrap-break-word">
                        <div className="font-mono text-[11px] text-muted-foreground">{clip(row.event_id, 36)}</div>
                        <div className="mt-1 font-medium">{row.event_key ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{row.event_type ?? '—'}</div>
                      </TableCell>
                      <TableCell className="max-w-40 text-sm wrap-break-word">
                        <div>{row.aggregate_type ?? '—'}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {row.aggregate_id ? clip(row.aggregate_id, 28) : '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">{row.attempt_count ?? '—'}</TableCell>
                      <TableCell className="space-y-0.5 whitespace-nowrap text-xs text-muted-foreground">
                        <div>{dt(row.occurred_at)}</div>
                        {row.failed_at ? <div>Failed {dt(row.failed_at)}</div> : null}
                      </TableCell>
                      <TableCell className="max-w-64 text-xs wrap-break-word" title={row.last_error ?? ''}>
                        {clip(row.last_error, 96) || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="rounded-full" asChild>
                          <Link href={`/admin/events/${encodeURIComponent(row.event_id)}`}>Open</Link>
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
