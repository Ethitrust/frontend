'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

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
import { Input } from '@/components/ui/input'
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
import type { AdminRiskFlagRow } from '@/lib/admin/admin-api-types'
import { fetchAdminRiskFlags, postAdminCreateRiskFlag } from '@/lib/admin/admin-people-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function formatDt(iso?: string | null) {
  if (!iso) {
    return '—'
  }
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

export function AdminRiskFlagsView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [createOpen, setCreateOpen] = useState(false)
  const [subjectType, setSubjectType] = useState('user')
  const [subjectId, setSubjectId] = useState('')
  const [riskScore, setRiskScore] = useState('50')
  const [flagsCsv, setFlagsCsv] = useState('')
  const [manualReason, setManualReason] = useState('')
  const [caseStatus, setCaseStatus] = useState('open')

  const listQuery = useQuery({
    queryKey: ['admin', 'risk-flags', 'list', page, pageSize],
    queryFn: () => fetchAdminRiskFlags(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      postAdminCreateRiskFlag(accessToken, {
        subject_type: subjectType.trim(),
        subject_id: subjectId.trim(),
        risk_score: Number(riskScore) || 0,
        suspicious_activity_flags: flagsCsv
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        manual_review_reason: manualReason.trim() || undefined,
        case_status: caseStatus.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Risk flag created')
      setCreateOpen(false)
      setSubjectId('')
      setFlagsCsv('')
      setManualReason('')
      void qc.invalidateQueries({ queryKey: ['admin', 'risk-flags', 'list'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>People & verification</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Risk flags
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>
            Compliance and manual review cases tied to platform subjects. Create a new flag when fraud or
            policy risk is confirmed.
          </p>
        </div>
        <Button type="button" className="rounded-full shrink-0" onClick={() => setCreateOpen(true)}>
          Create flag
        </Button>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load risk flags</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Open cases</CardTitle>
          <CardDescription>Page {page}. Full history may span additional pages.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No flags on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row: AdminRiskFlagRow) => (
                    <TableRow key={row.risk_flag_id}>
                      <TableCell>
                        <div className="font-medium">{row.subject_type}</div>
                        <div className="font-mono text-xs text-muted-foreground break-all">
                          {row.subject_id}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{row.risk_score}</TableCell>
                      <TableCell>
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          {(row.suspicious_activity_flags ?? []).slice(0, 6).map((f) => (
                            <Badge key={f} variant="outline" className="text-[10px] font-normal">
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{row.case_status ?? '—'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {(row.manual_review_reason ?? '').slice(0, 120)}
                          {(row.manual_review_reason?.length ?? 0) > 120 ? '…' : ''}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDt(row.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        {row.subject_type?.toLowerCase() === 'user' ? (
                          <Button variant="ghost" size="sm" className="rounded-full" asChild>
                            <Link href={`/admin/users/${encodeURIComponent(row.subject_id)}`}>
                              Workspace
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New risk flag</DialogTitle>
            <DialogDescription>Escalates a subject for manual review queues.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rf-subject-type">Subject type</Label>
              <Input
                id="rf-subject-type"
                value={subjectType}
                onChange={(ev) => setSubjectType(ev.target.value)}
                placeholder="user"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rf-subject-id">Subject id</Label>
              <Input
                id="rf-subject-id"
                value={subjectId}
                onChange={(ev) => setSubjectId(ev.target.value)}
                placeholder="UUID"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rf-score">Risk score</Label>
              <Input
                id="rf-score"
                inputMode="numeric"
                value={riskScore}
                onChange={(ev) => setRiskScore(ev.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rf-flags">Suspicious flags (comma separated)</Label>
              <Textarea
                id="rf-flags"
                value={flagsCsv}
                onChange={(ev) => setFlagsCsv(ev.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rf-reason">Manual review note</Label>
              <Textarea
                id="rf-reason"
                value={manualReason}
                onChange={(ev) => setManualReason(ev.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rf-case-status">Case status</Label>
              <Input
                id="rf-case-status"
                value={caseStatus}
                onChange={(ev) => setCaseStatus(ev.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!subjectId.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
