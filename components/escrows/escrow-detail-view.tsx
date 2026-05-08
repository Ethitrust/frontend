'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Gavel,
  Handshake,
  Landmark,
  Mail,
  Scale,
  Shield,
} from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAuthMe } from '@/lib/auth/me-session-api'
import { fetchMeDisputes } from '@/lib/disputes/me-disputes-api'
import type { EscrowDisputeRow } from '@/lib/disputes/dispute-types'
import { escrowPartyForViewer } from '@/lib/escrows/escrow-party'
import { fetchMeEscrow, fetchMeEscrowMilestones, postMeEscrowAction, type EscrowAction } from '@/lib/escrows/me-escrows-api'
import type { EscrowRow, MilestoneRow } from '@/lib/escrows/escrow-list-types'
import { formatEscrowDate, formatEscrowDateTime, formatEscrowMoney } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function statusBadgeVariant(status: string) {
  if (status === 'active') return 'secondary' as const
  if (status === 'completed') return 'outline' as const
  if (status === 'invited') return 'outline' as const
  if (status === 'pending_funding') return 'default' as const
  return 'outline' as const
}

function milestoneProgress(milestones: MilestoneRow[], currency: string) {
  const total = milestones.reduce((s, m) => s + m.amount, 0)
  const done = milestones
    .filter((m) => m.status === 'completed')
    .reduce((s, m) => s + m.amount, 0)
  if (total <= 0) return { pct: 0, done, total }
  return { pct: Math.round((done / total) * 100), done, total }
}

function disputeNeedsAttention(row: EscrowDisputeRow) {
  const s = (row.status ?? '').toLowerCase()
  if (!s) return false
  return !/resolved|closed|cancel|canceled|settled|completed/.test(s)
}

export function EscrowDetailNotFound({ escrowId }: { escrowId: string }) {
  const e = ethitrustThemeTokens
  return (
    <div className={cn(e.layout.container, 'py-16 lg:py-24')}>
      <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Escrow</p>
      <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal')}>Not found</h1>
      <p className={cn(e.typography.bodyMuted, 'mt-4 max-w-md')}>
        No escrow matches this link, or your session cannot access it anymore.
      </p>
      <p className="mt-4 font-mono text-xs text-muted-foreground break-all">{escrowId}</p>
      <Button className="mt-8 rounded-full" asChild>
        <Link href="/escrows">Back to escrows</Link>
      </Button>
    </div>
  )
}

export function EscrowDetailView({ escrowId }: { escrowId: string }) {
  const e = ethitrustThemeTokens
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  const meQuery = useQuery({
    queryKey: ['me', 'auth', 'me'],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  })

  const escrowQuery = useQuery({
    queryKey: ['me', 'escrows', escrowId],
    queryFn: () => fetchMeEscrow(accessToken!, escrowId),
    enabled: Boolean(accessToken && escrowId),
  })

  const milestonesQuery = useQuery({
    queryKey: ['me', 'escrows', escrowId, 'milestones'],
    queryFn: () => fetchMeEscrowMilestones(accessToken!, escrowId),
    enabled: Boolean(accessToken && escrowId && escrowQuery.isSuccess),
  })

  const disputeLinkQuery = useQuery({
    queryKey: ['me', 'disputes', 'for-escrow', escrowId],
    queryFn: async () => {
      const paginated = await fetchMeDisputes(accessToken!, 1, 100)
      const row = paginated.items.find((d) => d.escrow_id === escrowId && disputeNeedsAttention(d))
      return row?.id ?? null
    },
    enabled: Boolean(accessToken && escrowId && escrowQuery.isSuccess),
  })

  const actionMutation = useMutation({
    mutationFn: (vars: { action: EscrowAction; payload?: unknown }) =>
      postMeEscrowAction(accessToken!, escrowId, vars.action, vars.payload),
    onSuccess: async (_row, vars) => {
      toast.success(statusLabel(vars.action))
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['me', 'escrows'] }),
        qc.invalidateQueries({ queryKey: ['me', 'escrows', escrowId] }),
        qc.invalidateQueries({ queryKey: ['me', 'escrows', escrowId, 'milestones'] }),
        qc.invalidateQueries({ queryKey: ['me', 'disputes'] }),
      ])
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    },
  })

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <Button variant="ghost" size="sm" className="mb-6 rounded-full text-muted-foreground" asChild>
          <Link href="/escrows">
            <ArrowLeft className="size-4" />
            All escrows
          </Link>
        </Button>
        <Alert>
          <AlertTitle>Sign in to view escrow</AlertTitle>
          <AlertDescription>
            <Button asChild className="mt-3 rounded-full" size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (escrowQuery.isPending) {
    return (
      <div className={cn(e.layout.container, 'space-y-6 py-8 lg:py-12')}>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full max-w-2xl rounded-lg" />
        <Skeleton className="h-64 w-full max-w-4xl rounded-xl" />
      </div>
    )
  }

  if (escrowQuery.isError) {
    const msg =
      escrowQuery.error instanceof Error ? escrowQuery.error.message : 'Could not load escrow.'
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <Button variant="ghost" size="sm" className="mb-6 rounded-full text-muted-foreground" asChild>
          <Link href="/escrows">
            <ArrowLeft className="size-4" />
            All escrows
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Escrow unavailable</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>{msg}</p>
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href="/escrows">Return to list</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const escrow = escrowQuery.data as EscrowRow
  const viewerId = meQuery.data?.id ?? ''
  const party = escrowPartyForViewer(escrow, viewerId)
  const milestones = milestonesQuery.data ?? []
  const progress = milestoneProgress(milestones, escrow.currency)

  const roleLine =
    !viewerId
      ? meQuery.isPending
        ? 'Loading your participant context…'
        : 'Signed-in profile incomplete—refresh or sign back in.'
      : party === 'initiator'
        ? escrow.initiator_role === 'buyer'
          ? 'You are the buyer (initiator).'
          : 'You are the seller (initiator).'
        : party === 'receiver'
          ? escrow.initiator_role === 'buyer'
            ? 'You are the seller (invited counterparty).'
            : 'You are the buyer (invited counterparty).'
          : 'We could not map your user id onto initiator or receiver yet.'

  const deliveryLabel = escrow.delivery_date ? formatEscrowDateTime(escrow.delivery_date) : '—'
  const acting = actionMutation.isPending

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" asChild>
            <Link href="/escrows">
              <ArrowLeft className="size-4" />
              All escrows
            </Link>
          </Button>
        </div>

        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link href="/escrows" className="hover:text-foreground">
            Escrows
          </Link>
          <ChevronRight className="size-3.5 opacity-70" aria-hidden />
          <span className="max-w-[min(52ch,100%)] truncate text-foreground">{escrow.title}</span>
        </nav>

        <header className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadgeVariant(escrow.status)}>{statusLabel(escrow.status)}</Badge>
            <Badge variant="outline" className="capitalize">
              {escrow.escrow_type.replace(/_/g, ' ')}
            </Badge>
            {escrow.counter_status && escrow.counter_status !== 'none' ? (
              <Badge variant="outline">Counter: {statusLabel(escrow.counter_status)}</Badge>
            ) : null}
            {typeof escrow.offer_version === 'number' ? (
              <span className="text-xs text-muted-foreground">Offer v{escrow.offer_version}</span>
            ) : null}
          </div>
          <h1
            className={cn(
              e.typography.displayLG,
              'mt-3 font-serif font-normal tracking-tight text-foreground',
            )}
          >
            {escrow.title}
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3 max-w-2xl text-pretty')}>{roleLine}</p>
        </header>

        {disputeLinkQuery.data ? (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden />
            <AlertTitle>Open dispute</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>An active negotiation may need your attention for this escrow.</span>
              <Button size="sm" variant="secondary" className="rounded-full" asChild>
                <Link href={`/disputes/${encodeURIComponent(disputeLinkQuery.data!)}`}>
                  Open dispute room
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {milestonesQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Milestones unavailable</AlertTitle>
            <AlertDescription>
              {(milestonesQuery.error as Error)?.message ?? 'Could not load milestone schedule.'}
            </AlertDescription>
          </Alert>
        ) : null}

        {escrow.counter_status && escrow.counter_status !== 'none' ? (
          <Alert>
            <Scale aria-hidden />
            <AlertTitle>Counter-offer state</AlertTitle>
            <AlertDescription>
              Status{' '}
              <span className="font-medium text-foreground">{statusLabel(escrow.counter_status)}</span>.
              Negotiate accepted terms via the escrow actions API when ready—the UI will surface payload details
              when the backend exposes counter snapshots.
            </AlertDescription>
          </Alert>
        ) : null}

        {escrow.status === 'invited' &&
        escrow.receiver_email &&
        escrow.invitation_sent !== false ? (
          <Alert>
            <Mail aria-hidden />
            <AlertTitle>Invitation</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>
                Counterparty: <strong className="text-foreground">{escrow.receiver_email}</strong>
              </span>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link href={`/invite/${encodeURIComponent(escrow.id)}`}>Invitation precheck</Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Handshake className="size-4 text-muted-foreground" aria-hidden />
                Terms & scope
              </CardTitle>
              <CardDescription>Amounts, timelines, and acceptance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className={e.typography.statLabel}>Total amount</dt>
                  <dd className={cn(e.typography.statValue, 'text-2xl')}>
                    {formatEscrowMoney(escrow.amount, escrow.currency)}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Platform fee</dt>
                  <dd className={cn(e.typography.statValue, 'text-2xl')}>
                    {formatEscrowMoney(escrow.fee_amount ?? 0, escrow.currency)}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Fees paid by</dt>
                  <dd className="mt-1 text-sm font-medium capitalize">{escrow.who_pays_fees}</dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Target delivery</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
                    {deliveryLabel}
                  </dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Inspection period</dt>
                  <dd className="mt-1 text-sm font-medium">{escrow.inspection_period} hours</dd>
                </div>
                <div>
                  <dt className={e.typography.statLabel}>Dispute window</dt>
                  <dd className="mt-1 text-sm font-medium">{escrow.dispute_window} hours</dd>
                </div>
              </dl>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {escrow.description?.trim() || 'No description supplied.'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Acceptance criteria</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {escrow.acceptance_criteria?.trim() || '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Shield className="size-4 text-muted-foreground" aria-hidden />
                  Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Initiator role</p>
                  <p className="mt-1 font-medium capitalize">{escrow.initiator_role}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Initiator id</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {escrow.initiator_id ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Counterparty email</p>
                  <p className="mt-1 font-medium">{escrow.receiver_email || '—'}</p>
                </div>
                {escrow.receiver_id ? (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Receiver id</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {escrow.receiver_id}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {!milestonesQuery.isPending && milestones.length > 0 ? (
              <Card className="shadow-sm">
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold">Milestones</CardTitle>
                      <CardDescription>
                        {progress.pct}% released by value ·{' '}
                        {formatEscrowMoney(progress.done, escrow.currency)} of{' '}
                        {formatEscrowMoney(progress.total, escrow.currency)}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 rounded-full" asChild>
                      <Link href={`/escrows/${encodeURIComponent(escrow.id)}/milestones`}>Manage</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="max-h-64 space-y-3 overflow-y-auto pt-6">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug">{m.title}</p>
                        <Badge variant="outline" className="shrink-0 capitalize">
                          {m.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due {formatEscrowDate(m.due_date)} · {formatEscrowMoney(m.amount, escrow.currency)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : milestonesQuery.isPending ? (
              <Card className="shadow-sm">
                <CardContent className="py-6">
                  <Skeleton className="h-24 w-full rounded-lg" />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Gavel className="size-4 text-muted-foreground" aria-hidden />
              Actions
            </CardTitle>
            <CardDescription>Server-side rules apply; wire POST routes when you enable each action.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-6">
            {escrow.status === 'pending_funding' ? (
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-full" asChild>
                  <Link href="/wallet/deposit">
                    <Landmark />
                    Fund wallet
                  </Link>
                </Button>
                <Button
                  type="button"
                  disabled={acting}
                  variant="outline"
                  className="rounded-full"
                  onClick={() => actionMutation.mutate({ action: 'cancel' })}
                >
                  {acting ? 'Working…' : 'Cancel escrow'}
                </Button>
              </div>
            ) : null}

            {escrow.status === 'invited' && party === 'receiver' ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={acting}
                  className="rounded-full"
                  onClick={() => actionMutation.mutate({ action: 'accept' })}
                >
                  {acting ? 'Working…' : 'Accept escrow'}
                </Button>
                <Button
                  type="button"
                  disabled={acting}
                  variant="outline"
                  className="rounded-full"
                  onClick={() => actionMutation.mutate({ action: 'reject' })}
                >
                  {acting ? 'Working…' : 'Reject escrow'}
                </Button>
                <Button type="button" disabled variant="outline" className="rounded-full">
                  Counter offer
                </Button>
              </div>
            ) : null}

            {escrow.status === 'invited' && party === 'initiator' ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={acting}
                  variant="outline"
                  className="rounded-full"
                  onClick={() => actionMutation.mutate({ action: 'resend' })}
                >
                  {acting ? 'Working…' : 'Resend invitation'}
                </Button>
                <Button
                  type="button"
                  disabled={acting}
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => actionMutation.mutate({ action: 'cancel' })}
                >
                  {acting ? 'Working…' : 'Cancel escrow'}
                </Button>
              </div>
            ) : null}

            {escrow.status === 'active' ? (
              <div className="flex flex-wrap gap-2">
                {milestones.length > 0 ? (
                  <Button variant="outline" className="rounded-full" asChild>
                    <Link href={`/escrows/${encodeURIComponent(escrow.id)}/milestones`}>Milestones</Link>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  disabled={acting}
                  variant="outline"
                  className="rounded-full"
                  onClick={() => actionMutation.mutate({ action: 'submit' })}
                >
                  {acting ? 'Working…' : 'Submit delivery'}
                </Button>
                <Button
                  type="button"
                  disabled={acting}
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    actionMutation.mutate({
                      action: 'review',
                      payload: { decision: 'approve', note: 'Approved from escrow detail.' },
                    })
                  }
                >
                  {acting ? 'Working…' : 'Approve delivery'}
                </Button>
                <Button
                  type="button"
                  disabled={acting}
                  variant="outline"
                  className="rounded-full"
                  onClick={() => actionMutation.mutate({ action: 'complete' })}
                >
                  {acting ? 'Working…' : 'Complete escrow'}
                </Button>
                <Button
                  type="button"
                  disabled={acting}
                  variant="outline"
                  className="rounded-full"
                  onClick={() => actionMutation.mutate({ action: 'cancel' })}
                >
                  {acting ? 'Working…' : 'Cancel escrow'}
                </Button>
                <Button
                  type="button"
                  disabled={acting}
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    actionMutation.mutate({
                      action: 'dispute',
                      payload: { note: 'Dispute raised from escrow detail.' },
                    })
                  }
                >
                  {acting ? 'Working…' : 'Raise dispute'}
                </Button>
              </div>
            ) : null}

            {escrow.status === 'completed' ? (
              <p className="text-sm text-muted-foreground">This escrow is closed. No further actions apply.</p>
            ) : null}

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" className="rounded-full text-muted-foreground" asChild>
                <Link href={`/invite/${encodeURIComponent(escrow.id)}`}>Precheck (invite link flow)</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
