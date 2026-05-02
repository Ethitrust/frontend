'use client'

import Link from 'next/link'
import { Landmark, PiggyBank, type LucideIcon, Users } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AdminStructuredDataView, AdminUserSummaryCard } from '@/components/admin/admin-structured-data-view'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { AdminEscrowRelated } from '@/lib/admin/admin-api-types'
import {
  fetchAdminEscrowCounterOffers,
  fetchAdminEscrowLockFlow,
  fetchAdminEscrowMilestones,
  fetchAdminEscrowRecurringCycles,
  fetchAdminEscrowRelated,
  fetchAdminEscrowTimeline,
  postAdminEscrowAction,
  postAdminEscrowFlag,
} from '@/lib/admin/admin-platform-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAdminUserSummaries } from '@/hooks/admin/use-admin-user-summaries'

export function AdminEscrowConsoleView({
  accessToken,
  escrowId,
}: {
  accessToken: string
  escrowId: string
}) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')

  const [flagOpen, setFlagOpen] = useState(false)
  const [flagScore, setFlagScore] = useState('50')
  const [flagFlagsCsv, setFlagFlagsCsv] = useState('')
  const [flagReason, setFlagReason] = useState('')

  const [actionOpen, setActionOpen] = useState(false)
  const [escrowAction, setEscrowAction] = useState('cancel')
  const [actionReason, setActionReason] = useState('')

  const relatedQuery = useQuery({
    queryKey: ['admin', 'escrows', escrowId, 'related'],
    queryFn: () => fetchAdminEscrowRelated(accessToken, escrowId),
    enabled: Boolean(accessToken && escrowId),
  })

  const timelineQuery = useQuery({
    queryKey: ['admin', 'escrows', escrowId, 'timeline'],
    queryFn: () => fetchAdminEscrowTimeline(accessToken, escrowId),
    enabled: Boolean(accessToken && escrowId && tab === 'timeline'),
  })

  const milestonesQuery = useQuery({
    queryKey: ['admin', 'escrows', escrowId, 'milestones'],
    queryFn: () => fetchAdminEscrowMilestones(accessToken, escrowId),
    enabled: Boolean(accessToken && escrowId && tab === 'milestones'),
  })

  const counterOffersQuery = useQuery({
    queryKey: ['admin', 'escrows', escrowId, 'counter-offers'],
    queryFn: () => fetchAdminEscrowCounterOffers(accessToken, escrowId),
    enabled: Boolean(accessToken && escrowId && tab === 'counter'),
  })

  const recurringQuery = useQuery({
    queryKey: ['admin', 'escrows', escrowId, 'recurring'],
    queryFn: () => fetchAdminEscrowRecurringCycles(accessToken, escrowId),
    enabled: Boolean(accessToken && escrowId && tab === 'recurring'),
  })

  const lockFlowQuery = useQuery({
    queryKey: ['admin', 'escrows', escrowId, 'lock-flow'],
    queryFn: () => fetchAdminEscrowLockFlow(accessToken, escrowId),
    enabled: Boolean(accessToken && escrowId && tab === 'lock'),
  })

  const flagMutation = useMutation({
    mutationFn: () =>
      postAdminEscrowFlag(accessToken, escrowId, {
        risk_score: Number(flagScore) || 0,
        suspicious_activity_flags: flagFlagsCsv
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        manual_review_reason: flagReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Escrow flagged')
      setFlagOpen(false)
      void qc.invalidateQueries({ queryKey: ['admin', 'escrows'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const actionMutation = useMutation({
    mutationFn: () =>
      postAdminEscrowAction(accessToken, escrowId, {
        action: escrowAction,
        reason: actionReason.trim() || '(no reason)',
      }),
    onSuccess: () => {
      toast.success('Escrow action applied')
      setActionOpen(false)
      setActionReason('')
      void qc.invalidateQueries({ queryKey: ['admin', 'escrows', escrowId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const related = relatedQuery.data as AdminEscrowRelated | undefined
  const overviewPeopleIds = related?.users ?? []
  const { byId: peopleById, pendingById: peopleLoadingById } = useAdminUserSummaries(
    accessToken,
    overviewPeopleIds,
  )

  const entityDeck = (
    label: string,
    singular: string,
    Icon: LucideIcon,
    ids: string[] | undefined,
    hrefFn: (id: string) => string,
    emptyCopy: string,
    max = 12,
  ) => {
    if (!ids?.length) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
          </div>
          <p className="text-sm text-muted-foreground">{emptyCopy}</p>
        </div>
      )
    }
    const slice = ids.slice(0, max)
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {slice.map((id) => (
            <Link
              key={`${label}-${id}`}
              href={hrefFn(id)}
              className="group relative flex flex-col rounded-xl border bg-card px-3 py-2 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{singular}</span>
              <span className="mt-1 font-mono text-xs text-foreground">{id.length > 22 ? `${id.slice(0, 18)}…` : id}</span>
              <span className="mt-2 text-[10px] text-primary opacity-90 group-hover:opacity-100">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Escrow console
          </h1>
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{escrowId}</p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/admin/escrows">Back to escrows</Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Operator actions</CardTitle>
          <CardDescription>Flag compliance risk or apply a mediated lifecycle change.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="destructive" size="sm" className="rounded-full" onClick={() => setFlagOpen(true)}>
            Flag escrow
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setActionOpen(true)}>
            Apply action
          </Button>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="counter">Counter-offers</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="lock">Lock flow</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          {relatedQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Related records</AlertTitle>
              <AlertDescription>
                {relatedQuery.error instanceof Error ? relatedQuery.error.message : 'Could not load'}
              </AlertDescription>
            </Alert>
          ) : null}
          {relatedQuery.isPending ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Loading related artefacts…</p>
              <div className="flex flex-wrap gap-3">
                <div className="h-28 w-[min(280px,100%)] animate-pulse rounded-xl bg-muted/50" />
                <div className="h-28 w-[min(280px,100%)] animate-pulse rounded-xl bg-muted/50" />
              </div>
            </div>
          ) : related ? (
            <div className="space-y-12">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" aria-hidden />
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Parties & operators</p>
                </div>
                {overviewPeopleIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Directory links will appear once the escrow exposes participating user identifiers.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {overviewPeopleIds.map((uid) => (
                      <AdminUserSummaryCard
                        key={uid}
                        userId={uid}
                        user={peopleById[uid] ?? undefined}
                        isLoading={peopleLoadingById[uid]}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-10 md:grid-cols-2">
                {entityDeck(
                  'Wallets',
                  'Wallet',
                  PiggyBank,
                  related.wallet_ids,
                  (id) => `/admin/wallets/${encodeURIComponent(id)}`,
                  'No wallet surfaces were attached to this payload.',
                )}
                {entityDeck(
                  'Disputes',
                  'Dispute',
                  Landmark,
                  related.dispute_ids,
                  (id) => `/admin/disputes/${encodeURIComponent(id)}`,
                  'No disputes are linked from this vantage point.',
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Landmark className="size-4 text-muted-foreground" aria-hidden />
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Fees</p>
                </div>
                {(related.fee_ids ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fee identifiers bundled with this escrow.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(related.fee_ids ?? []).slice(0, 16).map((id) => (
                      <Badge key={id} variant="outline" className="max-w-[16rem] truncate font-mono text-[11px]" title={id}>
                        {id}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <AdminStructuredDataView
            accessToken={accessToken}
            data={timelineQuery.data}
            isPending={timelineQuery.isPending}
            errorMessage={
              timelineQuery.isError
                ? timelineQuery.error instanceof Error
                  ? timelineQuery.error.message
                  : 'Failed'
                : null
            }
          />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <AdminStructuredDataView
            accessToken={accessToken}
            data={milestonesQuery.data}
            isPending={milestonesQuery.isPending}
            errorMessage={
              milestonesQuery.isError
                ? milestonesQuery.error instanceof Error
                  ? milestonesQuery.error.message
                  : 'Failed'
                : null
            }
          />
        </TabsContent>

        <TabsContent value="counter" className="mt-6">
          <AdminStructuredDataView
            accessToken={accessToken}
            data={counterOffersQuery.data}
            isPending={counterOffersQuery.isPending}
            errorMessage={
              counterOffersQuery.isError
                ? counterOffersQuery.error instanceof Error
                  ? counterOffersQuery.error.message
                  : 'Failed'
                : null
            }
          />
        </TabsContent>

        <TabsContent value="recurring" className="mt-6">
          <AdminStructuredDataView
            accessToken={accessToken}
            data={recurringQuery.data}
            isPending={recurringQuery.isPending}
            errorMessage={
              recurringQuery.isError
                ? recurringQuery.error instanceof Error
                  ? recurringQuery.error.message
                  : 'Failed'
                : null
            }
          />
        </TabsContent>

        <TabsContent value="lock" className="mt-6">
          <AdminStructuredDataView
            accessToken={accessToken}
            data={lockFlowQuery.data}
            isPending={lockFlowQuery.isPending}
            errorMessage={
              lockFlowQuery.isError
                ? lockFlowQuery.error instanceof Error
                  ? lockFlowQuery.error.message
                  : 'Failed'
                : null
            }
          />
        </TabsContent>
      </Tabs>

      <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Flag escrow</DialogTitle>
            <DialogDescription>Creates a tracked risk escalation for treasury review.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ef-score">Risk score</Label>
              <Input
                id="ef-score"
                inputMode="numeric"
                value={flagScore}
                onChange={(ev) => setFlagScore(ev.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ef-flags">Suspicious flags (comma separated)</Label>
              <Textarea id="ef-flags" rows={3} value={flagFlagsCsv} onChange={(ev) => setFlagFlagsCsv(ev.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ef-reason">Manual review note</Label>
              <Textarea id="ef-reason" rows={2} value={flagReason} onChange={(ev) => setFlagReason(ev.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFlagOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={flagMutation.isPending} onClick={() => flagMutation.mutate()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply escrow action</DialogTitle>
            <DialogDescription>Audited moderation move with mandatory rationale.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Action code</Label>
              <Select value={escrowAction} onValueChange={setEscrowAction}>
                <SelectTrigger size="sm" className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cancel">Cancel</SelectItem>
                  <SelectItem value="release_hold">Release hold</SelectItem>
                  <SelectItem value="force_review">Force review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ea-reason">Reason</Label>
              <Textarea id="ea-reason" rows={3} value={actionReason} onChange={(ev) => setActionReason(ev.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActionOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
