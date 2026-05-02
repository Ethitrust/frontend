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
        {/* Admin document URLs often come from private buckets without Next/Image remotePatterns */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="aspect-4/3 w-full bg-muted object-contain" />
      </a>
    </div>
  )
}

export function AdminKycSubmissionDetailView({
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
    queryKey: ['admin', 'kyc', 'submission', submissionId],
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
      void qc.invalidateQueries({ queryKey: ['admin', 'kyc', 'submission', submissionId] })
      void qc.invalidateQueries({ queryKey: ['admin', 'kyc', 'submissions'] })
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
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Manual KYC</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Submission review
          </h1>
          <p className="mt-3 font-mono text-xs text-muted-foreground break-all">{submissionId}</p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/admin/kyc/submissions">Back to list</Link>
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
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : row ? (
        <>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Applicant</CardTitle>
              <CardDescription>Structured fields returned with the dossier.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Full name</div>
                  <div className="font-medium">{row.full_name ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">User id</div>
                  <div className="break-all font-mono text-sm">
                    <Link
                      href={`/admin/users/${encodeURIComponent(row.user_id)}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.user_id}
                    </Link>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Document type</div>
                  <div>{row.id_type ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Identifier</div>
                  <div>{row.id_number ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge variant="outline">{row.status ?? '—'}</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Submitted</div>
                  <div>{formatDt(row.submitted_at)}</div>
                </div>
              </div>
              {row.rejection_reason ? (
                <Alert className="mt-4">
                  <AlertTitle>Prior rejection rationale</AlertTitle>
                  <AlertDescription>{row.rejection_reason}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Captured images</CardTitle>
              <CardDescription>Open in a fresh tab when you need forensic zoom levels.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
              <DocImage label="Front of ID" url={row.front_id_url} />
              <DocImage label="Back of ID" url={row.back_id_url} />
              <DocImage label="Selfie" url={row.selfie_url} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Decision</CardTitle>
              <CardDescription>Writes to the audited submission-review endpoint.</CardDescription>
            </CardHeader>
            <CardContent className="max-w-xl space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sk-action">Action</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger id="sk-action" size="sm" className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="resubmission_required">Require resubmission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sk-reason">
                  Reason {action !== 'approve' ? '(required)' : '(optional)'}
                </Label>
                <Textarea
                  id="sk-reason"
                  rows={4}
                  value={rejectionReason}
                  onChange={(ev) => setRejectionReason(ev.target.value)}
                  placeholder={
                    action === 'approve'
                      ? 'Optional context for auditors'
                      : 'Explain why the applicant must fix or redo documents'
                  }
                />
              </div>
              <Button
                type="button"
                disabled={!canSubmit || reviewMutation.isPending}
                onClick={() => reviewMutation.mutate()}
              >
                Submit review
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
