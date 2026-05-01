'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, CircleDashed, Flag, Package } from 'lucide-react'

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
import { Skeleton } from '@/components/ui/skeleton'
import { fetchMeEscrow, fetchMeEscrowMilestones } from '@/lib/escrows/me-escrows-api'
import { formatEscrowDate, formatEscrowDateTime, formatEscrowMoney } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

function milestoneIcon(status: string) {
  if (status === 'completed') return CheckCircle2
  if (status === 'delivered') return Package
  return CircleDashed
}

export function EscrowMilestonesView({ escrowId }: { escrowId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const e = ethitrustThemeTokens

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

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <Alert>
          <AlertTitle>Sign in</AlertTitle>
          <AlertDescription>
            <Button asChild className="mt-3 rounded-full" size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (escrowQuery.isError) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <Button variant="ghost" size="sm" className="mb-6 rounded-full text-muted-foreground" asChild>
          <Link href={`/escrows/${escrowId}`}>
            <ArrowLeft className="size-4" />
            Back to escrow
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Could not load escrow</AlertTitle>
          <AlertDescription>
            {(escrowQuery.error as Error).message ?? 'Request failed'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (escrowQuery.isPending || !escrowQuery.data) {
    return (
      <div className={cn(e.layout.container, 'space-y-6 py-8 lg:py-12')}>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const escrow = escrowQuery.data

  const rows =
    milestonesQuery.data?.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? []

  if (!milestonesQuery.isPending && rows.length === 0) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <Button variant="ghost" size="sm" className="mb-6 rounded-full text-muted-foreground" asChild>
          <Link href={`/escrows/${escrowId}`}>
            <ArrowLeft className="size-4" />
            Back to escrow
          </Link>
        </Button>
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Milestones</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal')}>{escrow.title}</h1>
        <p className={cn(e.typography.bodyMuted, 'mt-4 max-w-lg')}>
          {escrow.escrow_type === 'milestone'
            ? 'No milestones were returned for this escrow. They may populate after provisioning completes.'
            : 'This escrow is not modeled as milestones. Funds follow the single delivery lifecycle on the main escrow detail page.'}
        </p>
        {milestonesQuery.isError ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Could not refresh milestones</AlertTitle>
            <AlertDescription>
              {(milestonesQuery.error as Error).message ?? 'Request failed'}
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <Button variant="ghost" size="sm" className="mb-6 rounded-full text-muted-foreground" asChild>
        <Link href={`/escrows/${escrowId}`}>
          <ArrowLeft className="size-4" />
          Back to escrow
        </Link>
      </Button>

      <header className="max-w-3xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Milestones</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          {escrow.title}
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Each step has its own amount, due date, and inspection hours after delivery.
        </p>
      </header>

      {milestonesQuery.isError ? (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Partial failure</AlertTitle>
          <AlertDescription>
            {(milestonesQuery.error as Error).message ?? 'Could not synchronize milestone list.'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-8 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">Schedule</CardTitle>
          <CardDescription>Server order ({rows.length})</CardDescription>
        </CardHeader>
        <CardContent className="divide-y px-0 pb-0 pt-0">
          {milestonesQuery.isPending ? (
            <div className="space-y-4 px-6 py-8">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            rows.map((m) => {
              const Icon = milestoneIcon(m.status)
              return (
                <div key={m.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/30">
                    <Icon className="size-5 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold leading-snug">{m.title}</h2>
                      <Badge variant="outline" className="capitalize">
                        {m.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{m.description?.trim() || '—'}</p>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-muted-foreground">Amount</dt>
                        <dd className="mt-0.5 font-medium tabular-nums">
                          {formatEscrowMoney(m.amount, escrow.currency)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-muted-foreground">Due</dt>
                        <dd className="mt-0.5 font-medium">{formatEscrowDate(m.due_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-muted-foreground">Inspection</dt>
                        <dd className="mt-0.5 font-medium">{m.inspection_hrs} hours after delivery</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-muted-foreground">Activity</dt>
                        <dd className="mt-0.5 text-muted-foreground">
                          {m.delivered_at
                            ? `Delivered ${formatEscrowDateTime(m.delivered_at)}`
                            : 'Not delivered'}
                          {m.completed_at ? ` · Completed ${formatEscrowDateTime(m.completed_at)}` : ''}
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {m.status === 'pending' ? (
                        <Button type="button" disabled variant="outline" size="sm" className="rounded-full">
                          <Flag />
                          Mark delivered
                        </Button>
                      ) : null}
                      {m.status === 'delivered' ? (
                        <Button type="button" disabled variant="outline" size="sm" className="rounded-full">
                          <CheckCircle2 />
                          Approve milestone
                        </Button>
                      ) : null}
                      {m.status === 'completed' ? (
                        <span className="text-sm text-muted-foreground">
                          Funds released for this milestone.
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
