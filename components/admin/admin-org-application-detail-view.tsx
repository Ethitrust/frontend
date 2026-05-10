'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Building, FileText, ShieldCheck, AlertCircle, ArrowLeft, Loader2Icon, Zap } from 'lucide-react'
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

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Organizations</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Application review
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{applicationId}</p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full group" asChild>
          <Link href="/admin/organizations/applications" className="flex items-center gap-2">
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to applications
          </Link>
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
          <Card className="shadow-sm border-muted/60">
            <CardHeader className="bg-muted/5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building className="size-4 text-primary" />
                Application Summary
              </CardTitle>
              <CardDescription>Submission metadata from the onboarding pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Organization name</dt>
                  <dd className="font-semibold text-foreground">{row.org_name ?? '—'}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tax ID (TIN)</dt>
                  <dd className="font-medium">{row.tin ?? '—'}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</dt>
                  <dd>
                    <Badge variant={row.status === 'approved' ? 'default' : row.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                      {row.status ?? '—'}
                    </Badge>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Applicant</dt>
                  <dd className="break-all font-mono text-xs">
                    <Link
                      href={`/admin/users/${encodeURIComponent(row.applicant_user_id)}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {row.applicant_user_id}
                    </Link>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</dt>
                  <dd className="text-sm">{formatDt(row.submitted_at)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Organization ID</dt>
                  <dd className="break-all font-mono text-[10px] text-muted-foreground">{row.org_id ?? '—'}</dd>
                </div>
              </dl>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="size-5 text-blue-500" />
                      <span className="font-medium">Business License</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-muted-foreground truncate" title={row.business_license_file_id || ''}>
                      ID: {row.business_license_file_id ?? 'None'}
                    </p>
                    {row.business_license_url ? (
                      <Button variant="outline" size="sm" className="w-full rounded-lg bg-background" asChild>
                        <a href={row.business_license_url} target="_blank" rel="noopener noreferrer">
                          View License
                        </a>
                      </Button>
                    ) : (
                      <div className="text-xs text-muted-foreground bg-background rounded-lg border border-dashed p-2 text-center">
                        No license available
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-5 text-emerald-500" />
                      <span className="font-medium">Comm. Registration</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-muted-foreground truncate" title={row.commercial_registration_file_id || ''}>
                      ID: {row.commercial_registration_file_id ?? 'None'}
                    </p>
                    {row.commercial_registration_url ? (
                      <Button variant="outline" size="sm" className="w-full rounded-lg bg-background" asChild>
                        <a href={row.commercial_registration_url} target="_blank" rel="noopener noreferrer">
                          View Registration
                        </a>
                      </Button>
                    ) : (
                      <div className="text-xs text-muted-foreground bg-background rounded-lg border border-dashed p-2 text-center">
                        No registration available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {row.rejection_reason ? (
                <Alert variant="destructive" className="mt-6 border-destructive/20 bg-destructive/5">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Rejection rationale</AlertTitle>
                  <AlertDescription>{row.rejection_reason}</AlertDescription>
                </Alert>
              ) : null}

              {row.reviewed_at && (
                <div className="mt-6 pt-6 border-t flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground">
                  <div>Reviewed on: <span className="text-foreground">{formatDt(row.reviewed_at)}</span></div>
                  <div>Reviewed by: <span className="font-mono text-foreground">{row.reviewed_by}</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted/60 overflow-hidden">
            <CardHeader className="bg-muted/5 border-b">
              <CardTitle className="text-base font-semibold">Final Decision</CardTitle>
              <CardDescription>Determine the outcome of this organization application.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="max-w-xl space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div 
                    onClick={() => setReviewAction('approve')}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 transition-all flex flex-col items-center gap-2 text-center",
                      reviewAction === 'approve' 
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" 
                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "size-10 rounded-full flex items-center justify-center",
                      reviewAction === 'approve' ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <ShieldCheck className="size-6" />
                    </div>
                    <span className="font-semibold">Approve</span>
                    <p className="text-[10px] text-muted-foreground">Grant workspace access and verify KYB status.</p>
                  </div>

                  <div 
                    onClick={() => setReviewAction('reject')}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 transition-all flex flex-col items-center gap-2 text-center",
                      reviewAction === 'reject' 
                        ? "border-destructive bg-destructive/5" 
                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "size-10 rounded-full flex items-center justify-center",
                      reviewAction === 'reject' ? "bg-destructive text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <AlertCircle className="size-6" />
                    </div>
                    <span className="font-semibold">Reject</span>
                    <p className="text-[10px] text-muted-foreground">Deny application. Applicant will see your note.</p>
                  </div>
                </div>

                {row.status === "pending" && (
                  <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="mt-0.5 size-4 text-primary" />
                      <div>
                        <h4 className="text-sm font-semibold text-primary">Automated Onboarding</h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          Upon approval, Ethitrust will automatically:
                        </p>
                        <ul className="mt-2 list-disc list-inside text-xs text-muted-foreground space-y-1">
                          <li>Activate the organization profile</li>
                          <li>Generate a "Default Full Access" API key</li>
                          <li>Send a welcome email with integration guides</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="oar-note" className="text-sm font-medium">Internal or External Note</Label>
                  <Textarea
                    id="oar-note"
                    rows={4}
                    value={reviewNote}
                    onChange={(ev) => setReviewNote(ev.target.value)}
                    placeholder={reviewAction === 'reject' ? "Explain why the application was rejected..." : "Add any context for this approval (optional)..."}
                    className="resize-none focus-visible:ring-primary/20"
                  />
                </div>

                <Button
                  type="button"
                  size="lg"
                  className={cn(
                    "w-full sm:w-auto rounded-full font-semibold px-8 transition-all",
                    reviewAction === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"
                  )}
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate()}
                >
                  {reviewMutation.isPending ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Confirm ${reviewAction.charAt(0).toUpperCase() + reviewAction.slice(1)}`
                  )}
                </Button>
              </div>
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
