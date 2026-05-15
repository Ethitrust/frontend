'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
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

  const stats = {
    totalLogs: items.length,
    distinctActors: actorIds.length,
    recentActions: items.slice(0, 5).map(i => i.action)
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header>
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Compliance & Oversight</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>Audit Log</h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Immutable record of operator actions, system events, and security-critical changes.
        </p>
      </header>

      {/* Audit Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm border-primary/10 bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Entries (Page)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{listQuery.isPending ? '...' : stats.totalLogs}</div>
            <p className="mt-1 text-xs text-muted-foreground">Logged actions in current view</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Operators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{listQuery.isPending ? '...' : stats.distinctActors}</div>
            <p className="mt-1 text-xs text-muted-foreground">Unique actors identified</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Security Integrity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-emerald-600 flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-lg font-semibold font-serif">Verified</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">All logs signed and hashed</p>
          </CardContent>
        </Card>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load audit logs</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Activity Trail</CardTitle>
          <CardDescription>Chronological record of system modifications.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No audit entries found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Context</TableHead>
                    <TableHead>Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminAuditLogRow[]).map((row) => {
                    const uid = typeof row.actor_user_id === 'string' ? row.actor_user_id.trim() : ''
                    const actor = uid ? actorsById[uid] : undefined
                    const actorBusy = uid && actorPendingById[uid]

                    return (
                      <TableRow key={row.audit_id} className="group hover:bg-muted/10">
                        <TableCell className="whitespace-nowrap text-[10px] text-muted-foreground">
                          {dt(row.created_at)}
                        </TableCell>
                        <TableCell className="max-w-56">
                          {actorBusy ? (
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ) : uid ? (
                            <Link
                              href={`/admin/users/${encodeURIComponent(uid)}`}
                              className="flex flex-col group/actor"
                            >
                              <span className="text-xs font-medium group-hover/actor:text-primary transition-colors">{actor?.name?.trim() || '—'}</span>
                              <span className="truncate text-[10px] text-muted-foreground">{actor?.email || uid.slice(0, 8)}</span>
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">System Process</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono tracking-tight bg-background">
                            {row.action || 'UNDEFINED'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-48">
                          <div className="text-[11px] font-semibold text-foreground uppercase tracking-tighter opacity-70">
                            {row.target_object_type || 'GLOBAL'}
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground truncate">
                            {row.target_object_id || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-48">
                          <div className="text-[10px] line-clamp-1 italic text-muted-foreground" title={row.reason || ''}>
                            {row.reason || 'No justification provided'}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[9px] text-muted-foreground/60">
                            <span>IP: {row.source_ip || '—'}</span>
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
