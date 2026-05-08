'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Clock3, FileCheck2, ShieldCheck, UploadCloud } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ComplianceFlowShell } from '@/components/kyc/compliance-flow-shell'
import { KycSessionGate } from '@/components/kyc/kyc-session-gate'
import {
  fetchManualKycSubmissionStatus,
  postManualKycSubmission,
  type ManualKycSubmissionStatus,
} from '@/lib/kyc/me-kyc-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import {
  assertManualFiles,
  kycManualSchema,
  type KycManualFormValues,
} from '@/lib/validators/kyc-manual'

function fileLabel(name: string, file: File | null) {
  return (
    <p className="text-xs text-muted-foreground">
      {name}: {file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : 'No file selected'}
    </p>
  )
}

function normalizeStatus(status?: string | null) {
  return (status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function manualStatusCopy(status: string | undefined | null) {
  const raw = normalizeStatus(status)
  if (raw === 'verified' || raw === 'approved') {
    return {
      label: 'Verified',
      title: 'Your identity is verified',
      description: 'Manual review is complete. You can continue using escrow and wallet workflows.',
      variant: 'secondary' as const,
      icon: CheckCircle2,
      canSubmit: false,
    }
  }
  if (raw === 'pending' || raw === 'submitted' || raw === 'in_review' || raw === 'processing') {
    return {
      label: 'Under review',
      title: 'Your documents are under review',
      description: 'The compliance team has your documents. You do not need to submit again unless they ask for changes.',
      variant: 'outline' as const,
      icon: Clock3,
      canSubmit: false,
    }
  }
  if (raw === 'rejected' || raw === 'failed' || raw === 'declined' || raw === 'resubmission_requested') {
    return {
      label: 'Needs resubmission',
      title: 'Please submit corrected documents',
      description: 'Review could not approve the previous packet. Upload clearer or corrected files below.',
      variant: 'destructive' as const,
      icon: AlertCircle,
      canSubmit: true,
    }
  }
  return {
    label: 'Not submitted',
    title: 'Submit your documents',
    description: 'Upload the front of your government ID so compliance can start manual review.',
    variant: 'default' as const,
    icon: UploadCloud,
    canSubmit: true,
  }
}

function ManualKycStatusPanel({
  status,
  loading,
  error,
}: {
  status: ManualKycSubmissionStatus | null | undefined
  loading: boolean
  error: Error | null
}) {
  if (loading) {
    return <Skeleton className="h-40 rounded-xl" />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" aria-hidden />
        <AlertTitle>Could not load KYC status</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  const copy = manualStatusCopy(status?.status)
  const Icon = copy.icon

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/35">
              <Icon className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">{copy.title}</CardTitle>
              <CardDescription className="mt-1 max-w-xl">{copy.description}</CardDescription>
            </div>
          </div>
          <Badge variant={copy.variant} className="capitalize">
            {copy.label}
          </Badge>
        </div>
      </CardHeader>
      {status ? (
        <CardContent className="grid gap-4 pt-5 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Submitted</p>
            <p className="mt-1 font-medium">{formatEscrowDateTime(status.submitted_at)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reviewed</p>
            <p className="mt-1 font-medium">{status.reviewed_at ? formatEscrowDateTime(status.reviewed_at) : 'Not yet'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{status.submission_id}</p>
          </div>
          {status.rejection_reason ? (
            <Alert variant="destructive" className="sm:col-span-3">
              <AlertTitle>Reviewer note</AlertTitle>
              <AlertDescription>{status.rejection_reason}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}

export function KycManualView() {
  return (
    <KycSessionGate
      title="Manual ID submission"
      description="Collect document photos for an operations review when automatic checks are not available."
    >
      {(accessToken) => <KycManualSignedIn accessToken={accessToken} />}
    </KycSessionGate>
  )
}

function KycManualSignedIn({ accessToken }: { accessToken: string }) {
  const qc = useQueryClient()
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  const statusQuery = useQuery({
    queryKey: ['me', 'kyc', 'manual-status'],
    queryFn: () => fetchManualKycSubmissionStatus(accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  })

  const form = useForm<KycManualFormValues>({
    resolver: zodResolver(kycManualSchema),    
    defaultValues: {
      holderName: '',
      idType: 'national_id',
      idNumber: '',
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (values: KycManualFormValues) => {
      const fileError = assertManualFiles({ front, back, selfie })
      if (fileError) throw new Error(fileError)

      const fd = new FormData()
      fd.set('full_name', values.holderName.trim())
      fd.set('id_number', values.idNumber.trim())
      fd.set('id_type', values.idType)

      fd.set('front_id_file', front!, front!.name)
      if (back) fd.set('back_id_file', back, back.name)
      if (selfie) fd.set('selfie_file', selfie, selfie.name)

      return postManualKycSubmission(accessToken, fd)
    },
    onSuccess: (data) => {
      toast.success('Documents submitted', {
        description: 'Your documents are now under review. You do not need to submit again unless compliance asks.',
      })
      qc.setQueryData(['me', 'kyc', 'manual-status'], data)
      void qc.invalidateQueries({ queryKey: ['me', 'auth', 'profile'] })
      void qc.invalidateQueries({ queryKey: ['me', 'kyc', 'manual-status'] })
      form.reset({ holderName: '', idType: 'national_id', idNumber: '' })
      setFront(null)
      setBack(null)
      setSelfie(null)
    },
    onError: (err) => {
      toast.error('Submission failed', {
        description: err instanceof Error ? err.message : 'Request failed.',
      })
    },
  })

  function onSubmit(values: KycManualFormValues) {
    submitMutation.mutate(values)
  }

  const statusCopy = manualStatusCopy(statusQuery.data?.status)
  const formDisabled = submitMutation.isPending || !statusCopy.canSubmit
  const statusLoading = statusQuery.isPending
  const showUploadForm = !statusLoading && statusCopy.canSubmit
  const showWaitingCard = !statusLoading && !statusCopy.canSubmit

  return (
    <ComplianceFlowShell
      title="Manual ID submission"
      description="Upload clear document photos once. After submission, this page will show the review state and next step."
      contentClassName="max-w-4xl"
    >
      <div className="space-y-6">
        <ManualKycStatusPanel
          status={statusQuery.data}
          loading={statusLoading}
          error={statusQuery.error instanceof Error ? statusQuery.error : null}
        />

        {showWaitingCard ? (
          <Card className="border-dashed bg-muted/35 shadow-none">
            <CardHeader>
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                <div>
                  <CardTitle className="text-base font-semibold">No action needed right now</CardTitle>
                  <CardDescription>
                    Your latest manual KYC packet is already in the compliance queue. We will update this page when
                    review is complete.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-3 border-t bg-background/50">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/kyc">Back to verification overview</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={() => void statusQuery.refetch()}
              >
                Refresh status
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {showUploadForm ? (
          <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-base font-semibold">Document packet</CardTitle>
          </div>
          <CardDescription>
            Match the legal name and number on the physical ID. Use sharp, uncropped photos with readable text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="holderName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Full legal name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="As printed on the ID"
                          className="rounded-lg"
                          disabled={formDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={formDisabled}>
                        <FormControl>
                          <SelectTrigger className="w-full rounded-lg">
                            <SelectValue placeholder="Choose type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="national_id">National ID card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="drivers_license">Driver’s licence</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document number</FormLabel>
                      <FormControl>
                        <Input className="rounded-lg font-mono text-sm uppercase" disabled={formDisabled} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">Photos</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormItem>
                    <FormLabel>Front</FormLabel>
                    <FormControl>
                      <Input
                        accept="image/jpeg,image/png,image/webp"
                        type="file"
                        className="rounded-lg bg-background"
                        disabled={formDisabled}
                        onChange={(ev) => setFront(ev.target.files?.[0] ?? null)}
                      />
                    </FormControl>
                    {fileLabel('Front', front)}
                  </FormItem>
                  <FormItem>
                    <FormLabel>Back (optional)</FormLabel>
                    <FormControl>
                      <Input
                        accept="image/jpeg,image/png,image/webp"
                        type="file"
                        className="rounded-lg bg-background"
                        disabled={formDisabled}
                        onChange={(ev) => setBack(ev.target.files?.[0] ?? null)}
                      />
                    </FormControl>
                    {fileLabel('Back', back)}
                  </FormItem>
                  <FormItem>
                    <FormLabel>Selfie (optional)</FormLabel>
                    <FormDescription className="text-xs">Add a live photo if you want to strengthen the submission.</FormDescription>
                    <FormControl>
                      <Input
                        accept="image/jpeg,image/png,image/webp"
                        type="file"
                        className="rounded-lg bg-background"
                        disabled={formDisabled}
                        onChange={(ev) => setSelfie(ev.target.files?.[0] ?? null)}
                      />
                    </FormControl>
                    {fileLabel('Selfie', selfie)}
                  </FormItem>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="rounded-full" disabled={formDisabled}>
                  {submitMutation.isPending ? 'Uploading…' : 'Submit for review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={formDisabled}
                  onClick={() => {
                    form.reset({ holderName: '', idType: 'national_id', idNumber: '' })
                    setFront(null)
                    setBack(null)
                    setSelfie(null)
                  }}
                >
                  Clear fields
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-4 border-t bg-muted/10 text-sm text-muted-foreground">
          <span>After upload, status changes to under review.</span>
          <Link href="/kyc" className="text-primary underline-offset-4 hover:underline">
            Verification overview
          </Link>
        </CardFooter>
      </Card>
      ) : null}
      </div>
    </ComplianceFlowShell>
  )
}
