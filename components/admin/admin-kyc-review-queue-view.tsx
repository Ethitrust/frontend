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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { AdminKycQueueRow } from '@/lib/admin/admin-api-types'
import { fetchAdminKycReviewQueue, postAdminKycUserReview } from '@/lib/admin/admin-people-api'
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

export function AdminKycReviewQueueView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [dialogUserId, setDialogUserId] = useState<string | null>(null)
  const [action, setAction] = useState('approve')
  const [note, setNote] = useState('')

  const listQuery = useQuery({
    queryKey: ['admin', 'kyc', 'review-queue', page, pageSize],
    queryFn: () => fetchAdminKycReviewQueue(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ user_id }: { user_id: string }) =>
      postAdminKycUserReview(accessToken, user_id, {
        action,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Review saved')
      setDialogUserId(null)
      setNote('')
      void qc.invalidateQueries({ queryKey: ['admin', 'kyc', 'review-queue'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const openReview = (userId: string) => {
    setDialogUserId(userId)
    setAction('approve')
    setNote('')
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>People & verification</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          KYC review queue
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Identity and manual review workloads waiting for operator decisions. Resolve items with audited
          actions and rationale.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load queue</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Queue</CardTitle>
          <CardDescription>Page {page}.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing is waiting on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[120px]">Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminKycQueueRow[]).map((row, i) => (
                    <TableRow key={`${row.user_id}-${row.submitted_at ?? ''}-${row.updated_at ?? ''}-${i}`}>
                      <TableCell className="align-top">
                        <div className="font-medium">{row.full_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{row.email ?? row.phone}</div>
                        <div className="mt-2 font-mono text-[11px] text-muted-foreground break-all">
                          {row.user_id}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline">{row.verification_status ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
                        {formatDt(row.submitted_at)}
                      </TableCell>
                      <TableCell className="space-y-2 text-right align-top">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          asChild
                        >
                          <Link href={`/admin/users/${encodeURIComponent(row.user_id)}`}>
                            Workspace
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full"
                          onClick={() => openReview(row.user_id)}
                        >
                          Review
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

      <Dialog open={Boolean(dialogUserId)} onOpenChange={(o) => !o && setDialogUserId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply decision</DialogTitle>
            <DialogDescription>User-scoped KYC verdict with optional moderator note.</DialogDescription>
          </DialogHeader>
          {dialogUserId ? (
            <p className="font-mono text-xs text-muted-foreground break-all">{dialogUserId}</p>
          ) : null}
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="kyc-act">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger id="kyc-act" size="sm" className="w-full cursor-pointer">
                  <SelectValue placeholder="Pick an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="manual_review_required">Manual review required</SelectItem>
                  <SelectItem value="verification_override">Verification override</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kyc-note">Note (optional)</Label>
              <Textarea
                id="kyc-note"
                rows={4}
                value={note}
                onChange={(ev) => setNote(ev.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogUserId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!dialogUserId || reviewMutation.isPending}
              onClick={() => dialogUserId && reviewMutation.mutate({ user_id: dialogUserId })}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
