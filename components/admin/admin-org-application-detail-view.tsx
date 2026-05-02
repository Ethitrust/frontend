'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from '@/components/ui/textarea'
import {
  fetchAdminOrgApplication,
  postAdminOrgApplicationReview,
  postAdminOrgSuspend,
  postAdminOrgUnsuspend,
} from '@/lib/admin/admin-organizations-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function formatDt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

export function AdminOrgApplicationDetailView({
  accessToken,
  applicationId,
}: {
  accessToken: string
  applicationId: string
}) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()

  const [reviewAction, setReviewAction] = useState('approve')
  const [reviewNote, setReviewNote] = useState('')
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [unsuspendOpen, setUnsuspendOpen] = useState(false)
  const [moderationReason, setModerationReason] = useState('')

  const detailQuery = useQuery({
    queryKey: ['admin', 'org-applications', 'detail', applicationId],
    queryFn: () => fetchAdminOrgApplication(accessToken, applicationId),
    enabled: Boolean(accessToken && applicationId),
  })

  const row = detailQuery.data
  const orgId = row?.org_id?.trim() ? row.org_id : null

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'org-applications', 'detail', applicationId] })
    void qc.invalidateQueries({ queryKey: ['admin', 'org-applications', 'list'] })
  }

  const reviewMutation = useMutation({
    mutationFn: () =>
      postAdminOrgApplicationReview(accessToken, applicationId, {
        action: reviewAction,
        note: reviewNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Review recorded')
      setReviewNote('')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const suspendMutation = useMutation({
    mutationFn: () =>
      postAdminOrgSuspend(accessToken, orgId!, {
        reason: moderationReason.trim() || '(operator action)',
      }),
    onSuccess: () => {
      toast.success('Organization suspended')
      setSuspendOpen(false)
      setModerationReason('')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const unsuspendMutation = useMutation({
    mutationFn: () =>
      postAdminOrgUnsuspend(accessToken, orgId!, {
        reason: moderationReason.trim() || '(operator action)',
      }),
    onSuccess: () => {
      toast.success('Suspension lifted')
      setUnsuspendOpen(false)
      setModerationReason('')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const licenseHref = row?.business_license_url?.trim()

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Organizations</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Application review
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{applicationId}</p>
          {detailQuery.data ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{detailQuery.data.status ?? '—'}</Badge>
              {detailQuery.data.org_name ? (
                <Badge variant="secondary">{detailQuery.data.org_name}</Badge>
              ) : null}
            </div>
          ) : null}
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/admin/organizations/applications">Back to applications</Link>
        </Button>
      </div>

      {detailQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load application</AlertTitle>
          <AlertDescription>
            {detailQuery.error instanceof Error ? detailQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      {detailQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : row ? (
        <>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
              <CardDescription>Submission metadata from the onboarding pipeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Organization name</dt>
                  <dd className="font-medium">{row.org_name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Organization id</dt>
                  <dd className="break-all font-mono text-sm">{row.org_id ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Applicant</dt>
                  <dd className="break-all font-mono text-sm">
                    <Link
                      href={`/admin/users/${encodeURIComponent(row.applicant_user_id)}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.applicant_user_id}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Tax ID (TIN)</dt>
                  <dd>{row.tin ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Submitted</dt>
                  <dd>{formatDt(row.submitted_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Reviewed</dt>
                  <dd>{formatDt(row.reviewed_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Reviewed by</dt>
                  <dd className="break-all font-mono text-xs">{row.reviewed_by ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Business license file</dt>
                  <dd className="break-all font-mono text-xs">{row.business_license_file_id ?? '—'}</dd>
                </div>
              </dl>
              {row.business_license_object_key ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Storage key:{' '}
                  <span className="font-mono text-foreground">{row.business_license_object_key}</span>
                </p>
              ) : null}
              {row.rejection_reason ? (
                <Alert className="mt-4">
                  <AlertTitle>Rejection rationale</AlertTitle>
                  <AlertDescription>{row.rejection_reason}</AlertDescription>
                </Alert>
              ) : null}
              <div className="mt-6">
                {licenseHref ? (
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <a href={licenseHref} target="_blank" rel="noopener noreferrer">
                      Open business license
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No license URL on this bundle.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Decision</CardTitle>
              <CardDescription>Writes to the application review envelope.</CardDescription>
            </CardHeader>
            <CardContent className="max-w-xl space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="oar-action">Action</Label>
                <Select value={reviewAction} onValueChange={setReviewAction}>
                  <SelectTrigger id="oar-action" size="sm" className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="oar-note">Note (optional)</Label>
                <Textarea
                  id="oar-note"
                  rows={3}
                  value={reviewNote}
                  onChange={(ev) => setReviewNote(ev.target.value)}
                  placeholder="Context for auditors or the applicant-facing trail"
                />
              </div>
              <Button
                type="button"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate()}
              >
                Submit review
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Organization moderation</CardTitle>
              <CardDescription>
                Suspend or lift suspension on the resolved organization identity when an id exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {orgId ? (
                <>
                  <Button type="button" variant="destructive" size="sm" className="rounded-full" onClick={() => { setModerationReason(''); setSuspendOpen(true) }}>
                    Suspend organization
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => { setModerationReason(''); setUnsuspendOpen(true) }}>
                    Unsuspend organization
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No organization id is linked yet; moderation targets apply once provisioning completes.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend organization</DialogTitle>
            <DialogDescription>
              Applies a suspension with audit trail on org <span className="font-mono text-xs">{orgId}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="suspend-reason">Reason</Label>
            <Textarea
              id="suspend-reason"
              rows={3}
              value={moderationReason}
              onChange={(ev) => setModerationReason(ev.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!orgId || suspendMutation.isPending}
              onClick={() => suspendMutation.mutate()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unsuspendOpen} onOpenChange={setUnsuspendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsuspend organization</DialogTitle>
            <DialogDescription>
              Lift enforcement on org <span className="font-mono text-xs">{orgId}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="unsuspend-reason">Reason</Label>
            <Textarea
              id="unsuspend-reason"
              rows={3}
              value={moderationReason}
              onChange={(ev) => setModerationReason(ev.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUnsuspendOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!orgId || unsuspendMutation.isPending} onClick={() => unsuspendMutation.mutate()}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
