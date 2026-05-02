'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import type { AdminNotificationDeliveryRow } from '@/lib/admin/admin-api-types'
import { fetchAdminPipelineDiagnostics } from '@/lib/admin/admin-dashboard-api'
import {
  fetchAdminNotificationDeliveries,
  postAdminNotificationDeliveryRetry,
} from '@/lib/admin/admin-messaging-audit-api'
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

function clip(s?: string | null, max = 72) {
  if (!s) return ''
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

const PIPELINE_QK = ['admin', 'notifications', 'pipeline-diagnostics'] as const

export function AdminNotificationDeliveriesListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [retryOpen, setRetryOpen] = useState(false)
  const [retryDeliveryId, setRetryDeliveryId] = useState<string | null>(null)
  const [retryReason, setRetryReason] = useState('')

  const pipelineQuery = useQuery({
    queryKey: PIPELINE_QK,
    queryFn: () => fetchAdminPipelineDiagnostics(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  })

  const listQuery = useQuery({
    queryKey: ['admin', 'notification-deliveries', 'list', page, pageSize],
    queryFn: () => fetchAdminNotificationDeliveries(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const pipeline = pipelineQuery.data
  const pipelineConcern =
    pipeline &&
    ((pipeline.failed_events ?? 0) > 0 || (pipeline.failed_deliveries ?? 0) > 0)

  const retryMutation = useMutation({
    mutationFn: () =>
      postAdminNotificationDeliveryRetry(accessToken, retryDeliveryId as string, {
        reason: retryReason.trim() || '(no reason)',
      }),
    onSuccess: () => {
      toast.success('Delivery retry queued')
      setRetryOpen(false)
      setRetryDeliveryId(null)
      setRetryReason('')
      void qc.invalidateQueries({ queryKey: ['admin', 'notification-deliveries'] })
      void qc.invalidateQueries({ queryKey: [...PIPELINE_QK] })
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'pipeline-diagnostics'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openRetry = (id: string) => {
    setRetryDeliveryId(id)
    setRetryReason('')
    setRetryOpen(true)
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Messaging & audits</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Notification deliveries
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Channel attempts for outbound notifications — retry stalled rows with an audit note when policy allows.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load deliveries</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">Pipeline snapshot</CardTitle>
            {pipelineConcern ? (
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
            ) : null}
          </div>
          <CardDescription>Event and delivery pressure from the upstream notification diagnostics.</CardDescription>
        </CardHeader>
        <CardContent>
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
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Failed deliveries</dt>
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
        </CardContent>
      </Card>

      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Deliveries</CardTitle>
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
                    <TableHead>Delivery</TableHead>
                    <TableHead>Notification</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Last error</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminNotificationDeliveryRow[]).map((row) => (
                    <TableRow key={row.delivery_id}>
                      <TableCell className="max-w-32 font-mono text-[11px] wrap-break-word">
                        <span title={row.delivery_id}>{clip(row.delivery_id, 14)}</span>
                      </TableCell>
                      <TableCell className="max-w-32 font-mono text-[11px] wrap-break-word">
                        {row.notification_id ? (
                          <span title={row.notification_id}>{clip(row.notification_id, 14)}</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{row.channel ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">{row.retry_count ?? '—'}</TableCell>
                      <TableCell className="space-y-0.5 text-xs text-muted-foreground">
                        <div>Sent {dt(row.sent_at)}</div>
                        <div>Next retry {dt(row.next_retry_at)}</div>
                      </TableCell>
                      <TableCell className="max-w-56 text-xs wrap-break-word" title={row.last_error ?? ''}>
                        {clip(row.last_error, 96) || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => openRetry(row.delivery_id)}>
                          Retry
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

      <Dialog
        open={retryOpen}
        onOpenChange={(o) => {
          setRetryOpen(o)
          if (!o) {
            setRetryDeliveryId(null)
            setRetryReason('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retry delivery</DialogTitle>
            <DialogDescription>Provide an internal reason recorded with the replay request.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="delivery-retry-reason">Reason</Label>
            <Textarea
              id="delivery-retry-reason"
              rows={3}
              value={retryReason}
              onChange={(ev) => setRetryReason(ev.target.value)}
              placeholder="Why are you triggering a retry?"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRetryOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!retryDeliveryId || retryMutation.isPending}
              onClick={() => retryMutation.mutate()}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
