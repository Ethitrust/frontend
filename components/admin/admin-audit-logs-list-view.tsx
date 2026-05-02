'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import type { AdminAuditLogRow } from '@/lib/admin/admin-api-types'
import { fetchAdminAuditLogs } from '@/lib/admin/admin-messaging-audit-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAdminUserSummaries } from '@/hooks/admin/use-admin-user-summaries'

function dt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

function clip(s?: string | null, max = 96) {
  if (!s) return ''
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export function AdminAuditLogsListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['admin', 'audit-logs', 'list', page, pageSize],
    queryFn: () => fetchAdminAuditLogs(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const actorIds = useMemo(() => {
    const s = new Set<string>()
    for (const row of items as AdminAuditLogRow[]) {
      const id = typeof row.actor_user_id === 'string' ? row.actor_user_id.trim() : ''
      if (id) s.add(id)
    }
    return [...s]
  }, [items])

  const { byId: actorsById, pendingById: actorPendingById } = useAdminUserSummaries(accessToken, actorIds)

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Messaging & audits</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>Audit log</h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Immutable trail of moderated actions plus request metadata for investigations.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load audit logs</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Trail</CardTitle>
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
                    <TableHead>When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminAuditLogRow[]).map((row) => {
                    const uid = typeof row.actor_user_id === 'string' ? row.actor_user_id.trim() : ''
                    const actor = uid ? actorsById[uid] : undefined
                    const actorBusy = uid && actorPendingById[uid]

                    return (
                      <TableRow key={row.audit_id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {dt(row.created_at)}
                        </TableCell>
                        <TableCell className="max-w-56 align-top">
                          {actorBusy ? (
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-44" />
                            </div>
                          ) : uid ? (
                            <Link
                              href={`/admin/users/${encodeURIComponent(uid)}`}
                              className="flex flex-col gap-0.5 underline-offset-4 hover:underline"
                            >
                              <span className="text-sm font-medium leading-snug">{actor?.name?.trim() || '—'}</span>
                              {actor?.email ? (
                                <span className="truncate text-xs text-muted-foreground">{actor.email}</span>
                              ) : null}
                              <span className="wrap-break-word font-mono text-[10px] text-muted-foreground">
                                {uid}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-40 text-sm font-medium wrap-break-word">
                          {row.action ?? '—'}
                        </TableCell>
                        <TableCell className="max-w-48 text-sm wrap-break-word">
                          <div className="text-muted-foreground">{row.target_object_type ?? '—'}</div>
                          <div className="font-mono text-[11px]">
                            {row.target_object_id ? clip(row.target_object_id, 40) : '—'}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-56 text-xs wrap-break-word" title={row.reason ?? ''}>
                          {clip(row.reason) || '—'}
                        </TableCell>
                        <TableCell className="max-w-48 text-xs wrap-break-word">
                          <div title={row.source_ip ?? ''}>IP {row.source_ip ?? '—'}</div>
                          <div className="mt-0.5 text-muted-foreground" title={row.user_agent ?? ''}>
                            {clip(row.user_agent, 72) || '—'}
                          </div>
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
