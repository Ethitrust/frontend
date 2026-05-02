'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AdminOperatorGate } from '@/components/admin/admin-operator-gate'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchAdminKycCrossCheck,
  fetchAdminKycDocuments,
  fetchAdminUserContext,
  fetchAdminUserRowByScan,
  postAdminBanUser,
  postAdminResetUserRisk,
  postAdminUnbanUser,
} from '@/lib/admin/admin-people-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function prettyJson(rows: Record<string, unknown>[]) {
  try {
    return JSON.stringify(rows, null, 2)
  } catch {
    return String(rows?.length ?? 0)
  }
}

export function AdminUserWorkspaceShell({ userId }: { userId: string }) {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => (
        <AdminUserWorkspaceView accessToken={accessToken} userId={userId} />
      )}
    </AdminOperatorGate>
  )
}

function AdminUserWorkspaceView({
  accessToken,
  userId,
}: {
  accessToken: string
  userId: string
}) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [banOpen, setBanOpen] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banExpires, setBanExpires] = useState('')

  const summaryQuery = useQuery({
    queryKey: ['admin', 'users', 'summary-scan', userId],
    queryFn: () => fetchAdminUserRowByScan(accessToken, userId),
    enabled: Boolean(accessToken && userId),
  })

  const contextQuery = useQuery({
    queryKey: ['admin', 'users', 'context', userId],
    queryFn: () => fetchAdminUserContext(accessToken, userId),
    enabled: Boolean(accessToken && userId),
  })

  const crossCheckQuery = useQuery({
    queryKey: ['admin', 'kyc', 'cross-check', userId],
    queryFn: () => fetchAdminKycCrossCheck(accessToken, userId),
    enabled: Boolean(accessToken && userId),
  })

  const documentsQuery = useQuery({
    queryKey: ['admin', 'kyc', 'documents', userId],
    queryFn: () => fetchAdminKycDocuments(accessToken, userId),
    enabled: Boolean(accessToken && userId),
  })

  const invalidateUser = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'users', 'summary-scan', userId] })
    void qc.invalidateQueries({ queryKey: ['admin', 'users', 'context', userId] })
    void qc.invalidateQueries({ queryKey: ['admin', 'kyc', 'cross-check', userId] })
  }

  const banMutation = useMutation({
    mutationFn: () =>
      postAdminBanUser(accessToken, userId, {
        reason: banReason.trim() || '(no reason provided)',
        expires_at: banExpires.trim() ? new Date(banExpires).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success('User banned')
      setBanOpen(false)
      setBanReason('')
      setBanExpires('')
      invalidateUser()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const unbanMutation = useMutation({
    mutationFn: () => postAdminUnbanUser(accessToken, userId),
    onSuccess: () => {
      toast.success('User unbanned')
      invalidateUser()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const resetRiskMutation = useMutation({
    mutationFn: () => postAdminResetUserRisk(accessToken, userId),
    onSuccess: () => {
      toast.success('Risk flags reset')
      invalidateUser()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const row = summaryQuery.data
  const ctx = contextQuery.data

  const docsRaw = documentsQuery.data

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>People & verification</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            User workspace
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{userId}</p>
          {summaryQuery.isError ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Profile row</AlertTitle>
              <AlertDescription>
                Could not locate this account in the directory snapshot. Moderation APIs may still apply.
              </AlertDescription>
            </Alert>
          ) : summaryQuery.isPending ? (
            <div className="mt-6 space-y-2">
              <Skeleton className="h-10 w-full max-w-xl" />
            </div>
          ) : row ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="outline">{row.email}</Badge>
              {row.role ? <Badge variant="secondary">{row.role}</Badge> : null}
              {row.banned ? <Badge variant="destructive">Banned</Badge> : <Badge>Open</Badge>}
              {row.kyc_status ? <Badge variant="outline">KYC {row.kyc_status}</Badge> : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              This user was not found in the directory scan. Actions below still apply.
            </p>
          )}
        </header>
        <Button variant="outline" className="rounded-full shrink-0" asChild>
          <Link href="/admin/users">Back to directory</Link>
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Shortcuts</CardTitle>
            <CardDescription>Related queues and artefacts for this identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full rounded-full justify-start" asChild>
              <Link href="/admin/kyc/review-queue">KYC review queue</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full rounded-full justify-start" asChild>
              <Link href="/admin/kyc/submissions">Manual KYC submissions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Moderation</CardTitle>
            <CardDescription>Banning, lifts, and risk tooling.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={row?.banned === true || banMutation.isPending}
              onClick={() => setBanOpen(true)}
            >
              Ban user
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={row?.banned !== true || unbanMutation.isPending}
              onClick={() => unbanMutation.mutate()}
            >
              Unban user
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={resetRiskMutation.isPending}
              onClick={() => resetRiskMutation.mutate()}
            >
              Reset risk flags
            </Button>
          </CardContent>
        </Card>
      </section>

      {contextQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Context failed</AlertTitle>
          <AlertDescription>
            {contextQuery.error instanceof Error ? contextQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Operator context</CardTitle>
          <CardDescription>
            Sessions, linked accounts, memberships, and invitations surfaced for investigations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contextQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : ctx ? (
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="sessions">
                <AccordionTrigger>Sessions ({ctx.sessions?.length ?? 0})</AccordionTrigger>
                <AccordionContent>
                  <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
                    {prettyJson(Array.isArray(ctx.sessions) ? (ctx.sessions as Record<string, unknown>[]) : [])}
                  </pre>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="accounts">
                <AccordionTrigger>Linked accounts ({ctx.accounts?.length ?? 0})</AccordionTrigger>
                <AccordionContent>
                  <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
                    {prettyJson(Array.isArray(ctx.accounts) ? (ctx.accounts as Record<string, unknown>[]) : [])}
                  </pre>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="memberships">
                <AccordionTrigger>Memberships ({ctx.memberships?.length ?? 0})</AccordionTrigger>
                <AccordionContent>
                  <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
                    {prettyJson(Array.isArray(ctx.memberships) ? (ctx.memberships as Record<string, unknown>[]) : [])}
                  </pre>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="invitations">
                <AccordionTrigger>Invitations ({ctx.invitations?.length ?? 0})</AccordionTrigger>
                <AccordionContent>
                  <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
                    {prettyJson(Array.isArray(ctx.invitations) ? (ctx.invitations as Record<string, unknown>[]) : [])}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">KYC cross-check</CardTitle>
            <CardDescription>Snapshot of profile vs KYC fields.</CardDescription>
          </CardHeader>
          <CardContent>
            {crossCheckQuery.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : crossCheckQuery.isError ? (
              <p className="text-sm text-muted-foreground">
                {crossCheckQuery.error instanceof Error ? crossCheckQuery.error.message : 'Could not load'}
              </p>
            ) : crossCheckQuery.data ? (
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">User email</dt>
                  <dd>{crossCheckQuery.data.user_email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">KYC email</dt>
                  <dd>{crossCheckQuery.data.kyc_email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">User name</dt>
                  <dd>{crossCheckQuery.data.user_name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">KYC full name</dt>
                  <dd>{crossCheckQuery.data.kyc_full_name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">KYC phone</dt>
                  <dd>{crossCheckQuery.data.kyc_phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">KYC status</dt>
                  <dd>{crossCheckQuery.data.kyc_status ?? '—'}</dd>
                </div>
              </dl>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">KYC documents</CardTitle>
            <CardDescription>Raw export bundle from the upstream provider.</CardDescription>
          </CardHeader>
          <CardContent>
            {documentsQuery.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : documentsQuery.isError ? (
              <p className="text-sm text-muted-foreground">
                {documentsQuery.error instanceof Error ? documentsQuery.error.message : 'Could not load'}
              </p>
            ) : (
              <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
                {docsRaw === undefined
                  ? '—'
                  : typeof docsRaw === 'string'
                    ? docsRaw
                    : JSON.stringify(docsRaw, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ban user</DialogTitle>
            <DialogDescription>
              Applies a suspension with audit trail and optional expiry. Reason is surfaced to moderation history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ban-reason">Reason</Label>
              <Textarea
                id="ban-reason"
                value={banReason}
                onChange={(ev) => setBanReason(ev.target.value)}
                rows={3}
                placeholder="Why is this account being banned?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ban-expires">Lift after (optional)</Label>
              <Input
                id="ban-expires"
                type="datetime-local"
                value={banExpires}
                onChange={(ev) => setBanExpires(ev.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBanOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={banMutation.isPending}
              onClick={() => banMutation.mutate()}
            >
              Confirm ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
