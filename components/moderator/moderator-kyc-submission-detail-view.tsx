'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { fetchAdminKycSubmission, postAdminKycSubmissionReview } from '@/lib/admin/admin-people-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function DocImage({ label, url }: { label: string; url?: string | null }) {
  if (!url) {
    return null
  }
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="aspect-4/3 w-full bg-muted object-contain" />
      </a>
    </div>
  )
}

export function ModeratorKycSubmissionDetailView({
  accessToken,
  submissionId,
}: {
  accessToken: string
  submissionId: string
}) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [action, setAction] = useState('approve')
  const [rejectionReason, setRejectionReason] = useState('')

  const detailQuery = useQuery({
    queryKey: ['moderator', 'kyc', 'submission', submissionId],
    queryFn: () => fetchAdminKycSubmission(accessToken, submissionId),
    enabled: Boolean(accessToken && submissionId),
  })

  const row = detailQuery.data

  const reviewMutation = useMutation({
    mutationFn: () =>
      postAdminKycSubmissionReview(accessToken, submissionId, {
        action,
        rejection_reason: action === 'approve' ? undefined : rejectionReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Submission updated')
      void qc.invalidateQueries({ queryKey: ['moderator', 'kyc', 'submission', submissionId] })
      void qc.invalidateQueries({ queryKey: ['moderator', 'kyc', 'submissions'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const formatDt = (iso?: string | null) => {
    if (!iso) return '—'
    try {
      return formatEscrowDateTime(iso)
    } catch {
      return iso
    }
  }

  const canSubmit =
    action === 'approve' || (action !== 'approve' && rejectionReason.trim().length > 0)

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Verification</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Submission review
          </h1>
          <p className="mt-3 font-mono text-xs text-muted-foreground break-all">{submissionId}</p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/moderator/kyc/submissions">Back to list</Link>
        </Button>
      </div>

      {detailQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load submission</AlertTitle>
          <AlertDescription>
            {detailQuery.error instanceof Error ? detailQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      {detailQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-lg" />
          <Skeleton className="h-40 w-full max-w-xl" />
        </div>
      ) : row ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Documents</CardTitle>
              <CardDescription>Front, back, and selfie images.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DocImage label="Front ID" url={row.front_id_url} />
              <DocImage label="Back ID" url={row.back_id_url} />
              <DocImage label="Selfie" url={row.selfie_url} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Status</CardTitle>
                <CardDescription>
                  Current: <Badge variant="outline">{row.status ?? '—'}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Submitted: <span className="text-foreground">{formatDt(row.submitted_at)}</span>
                </p>
                {row.reviewed_at ? (
                  <p className="text-muted-foreground">
                    Reviewed: <span className="text-foreground">{formatDt(row.reviewed_at)}</span>
                  </p>
                ) : null}
                {row.reviewed_by ? (
                  <p className="text-muted-foreground">
                    By: <span className="font-mono text-xs text-foreground">{row.reviewed_by}</span>
                  </p>
                ) : null}
                {row.rejection_reason ? (
                  <p className="text-muted-foreground">
                    Reason: <span className="text-foreground">{row.rejection_reason}</span>
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Full name: <span className="text-foreground">{row.full_name ?? '—'}</span>
                </p>
                <p className="text-muted-foreground">
                  ID type: <span className="text-foreground">{row.id_type ?? '—'}</span>
                </p>
                <p className="text-muted-foreground">
                  ID number: <span className="text-foreground">{row.id_number ?? '—'}</span>
                </p>
                <p className="text-muted-foreground">
                  User: <span className="font-mono text-xs text-foreground">{row.user_id}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Decision</CardTitle>
                <CardDescription>Record a review decision.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger size="sm" className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="request_resubmission">Request resubmission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {action !== 'approve' && (
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason / note</Label>
                    <Textarea
                      id="reason"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Required when rejecting or requesting resubmission"
                    />
                  </div>
                )}

                <Button
                  type="button"
                  disabled={!canSubmit || reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate()}
                >
                  {reviewMutation.isPending ? 'Saving…' : 'Submit decision'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
