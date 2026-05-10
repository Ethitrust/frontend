'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { AdminJsonInspect } from '@/components/admin/admin-json-inspect'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import {
  fetchAdminDisputeThread,
  postAdminDisputeResolutionNote,
  postAdminDisputeAction,
  fetchAdminDisputeForensics,
  postAdminDisputeAnalyzeChat,
  postAdminEvidenceRerunEla,
  fetchAdminDisputeAnalyses,
} from '@/lib/admin/admin-platform-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

/** Best-effort extraction of evidence identifiers from the opaque thread payload. */
function extractEvidenceOptions(threadData: unknown): { id: string; label: string }[] {
  if (!threadData || typeof threadData !== 'object') return []
  const data = threadData as Record<string, unknown>

  const fromArray = (arr: unknown[]): { id: string; label: string }[] =>
    arr
      .map((ev) => {
        if (typeof ev === 'string') return { id: ev, label: ev }
        if (ev && typeof ev === 'object') {
          const e = ev as Record<string, unknown>
          const id = String(e.evidence_id ?? e.id ?? e.evidenceId ?? '')
          if (!id) return null
          const name = String(e.filename ?? e.file_name ?? e.type ?? e.label ?? e.name ?? '')
          const label = name && name !== id ? `${name} (${id.slice(0, 8)}…)` : id.slice(0, 24)
          return { id, label }
        }
        return null
      })
      .filter((x): x is { id: string; label: string } => Boolean(x && x.id))

  if (Array.isArray(data.evidence)) return fromArray(data.evidence)
  if (Array.isArray(data.evidence_items)) return fromArray(data.evidence_items)
  if (Array.isArray(data.evidence_ids)) {
    return data.evidence_ids
      .filter((id): id is string => typeof id === 'string')
      .map((id) => ({ id, label: id }))
  }

  // Try messages array
  if (Array.isArray(data.messages)) {
    const ids = new Set<string>()
    data.messages.forEach((msg) => {
      if (!msg || typeof msg !== 'object') return
      const m = msg as Record<string, unknown>
      const evId = String(m.evidence_id ?? m.evidenceId ?? '')
      if (evId) ids.add(evId)
      const attachments = m.attachments ?? m.evidence
      if (Array.isArray(attachments)) {
        attachments.forEach((att) => {
          if (typeof att === 'string') ids.add(att)
          else if (att && typeof att === 'object') {
            const a = att as Record<string, unknown>
            const id = String(a.evidence_id ?? a.id ?? a.evidenceId ?? '')
            if (id) ids.add(id)
          }
        })
      }
    })
    return Array.from(ids).map((id) => ({ id, label: id }))
  }

  return []
}

export function ModeratorDisputeConsoleView({
  accessToken,
  disputeId,
}: {
  accessToken: string
  disputeId: string
}) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()

  const threadQuery = useQuery({
    queryKey: ['moderator', 'disputes', disputeId, 'thread'],
    queryFn: () => fetchAdminDisputeThread(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  })

  const forensicsQuery = useQuery({
    queryKey: ['moderator', 'disputes', disputeId, 'forensics'],
    queryFn: () => fetchAdminDisputeForensics(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  })

  const analysesQuery = useQuery({
    queryKey: ['moderator', 'disputes', disputeId, 'analyses'],
    queryFn: () => fetchAdminDisputeAnalyses(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  })

  const [resolutionNote, setResolutionNote] = useState('')
  const [winner, setWinner] = useState<'buyer' | 'seller'>('buyer')
  const [resolutionDecisionNote, setResolutionDecisionNote] = useState('')
  const [evidenceId, setEvidenceId] = useState('')

  const invalidateThread = () => {
    void qc.invalidateQueries({ queryKey: ['moderator', 'disputes', disputeId, 'thread'] })
  }

  const invalidateForensics = () => {
    void qc.invalidateQueries({ queryKey: ['moderator', 'disputes', disputeId, 'forensics'] })
  }

  const invalidateAnalyses = () => {
    void qc.invalidateQueries({ queryKey: ['moderator', 'disputes', disputeId, 'analyses'] })
  }

  const noteMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeResolutionNote(accessToken, disputeId, {
        note: resolutionNote.trim() || '(empty note)',
      }),
    onSuccess: () => {
      toast.success('Resolution note added')
      setResolutionNote('')
      invalidateThread()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const resolveMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeAction(accessToken, disputeId, {
        action: `resolve_${winner}`,
        note: resolutionDecisionNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(`Dispute resolved in favor of ${winner}`)
      setResolutionDecisionNote('')
      invalidateThread()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const analyzeChatMutation = useMutation({
    mutationFn: () => postAdminDisputeAnalyzeChat(accessToken, disputeId),
    onSuccess: () => {
      toast.success('Chat analysis complete')
      invalidateAnalyses()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rerunElaMutation = useMutation({
    mutationFn: () => postAdminEvidenceRerunEla(accessToken, evidenceId.trim()),
    onSuccess: () => {
      toast.success('ELA analysis queued')
      invalidateForensics()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const threadErr =
    threadQuery.isError && threadQuery.error instanceof Error ? threadQuery.error.message : null

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Disputes</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Dispute console
          </h1>
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{disputeId}</p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/moderator/disputes/assigned">Back to assigned</Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Thread snapshot</CardTitle>
          <CardDescription>Latest serialized thread export.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminJsonInspect
            data={threadQuery.data}
            isPending={threadQuery.isPending}
            errorMessage={threadErr}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Workflow tools</CardTitle>
          <CardDescription>Moderator actions for this dispute.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Resolution note</h3>
            <div className="max-w-xl space-y-2">
              <Textarea
                rows={3}
                value={resolutionNote}
                onChange={(ev) => setResolutionNote(ev.target.value)}
                placeholder="Internal note surfaced on the dispute ledger"
              />
              <Button
                type="button"
                variant="outline"
                disabled={noteMutation.isPending}
                onClick={() => noteMutation.mutate()}
              >
                Add note
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-foreground">Resolve dispute</h3>
            <p className="max-w-xl text-xs text-muted-foreground">
              As the assigned moderator, your decision is final. Select who the dispute resolves in favor of and
              provide a justification before submitting.
            </p>
            <div className="grid max-w-xl gap-4">
              <div className="space-y-2">
                <Label>Resolution</Label>
                <Select value={winner} onValueChange={(v) => setWinner(v as 'buyer' | 'seller')}>
                  <SelectTrigger size="sm" className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Resolve in favor of Buyer</SelectItem>
                    <SelectItem value="seller">Resolve in favor of Seller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution-note">Justification</Label>
                <Textarea
                  id="resolution-note"
                  rows={3}
                  value={resolutionDecisionNote}
                  onChange={(ev) => setResolutionDecisionNote(ev.target.value)}
                  placeholder="Required: explain the rationale for this resolution decision"
                />
              </div>
              <Button
                type="button"
                disabled={!resolutionDecisionNote.trim() || resolveMutation.isPending}
                onClick={() => resolveMutation.mutate()}
              >
                {resolveMutation.isPending ? 'Submitting…' : 'Submit final resolution'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Evidence integrity</CardTitle>
          <CardDescription>
            Select an evidence bundle from the thread to re-run ELA forensics.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-xl space-y-4">
          {(() => {
            const evidenceOptions = extractEvidenceOptions(threadQuery.data)
            if (threadQuery.isPending) {
              return (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )
            }
            if (evidenceOptions.length === 0) {
              return (
                <Alert>
                  <AlertTitle>No evidence found</AlertTitle>
                  <AlertDescription className="text-xs">
                    This thread does not contain any extractable evidence identifiers.
                  </AlertDescription>
                </Alert>
              )
            }
            return (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ev-id">Evidence bundle</Label>
                  <Select value={evidenceId} onValueChange={setEvidenceId}>
                    <SelectTrigger id="ev-id" size="sm" className="w-full cursor-pointer">
                      <SelectValue placeholder="Select evidence…" />
                    </SelectTrigger>
                    <SelectContent>
                      {evidenceOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!evidenceId.trim() || rerunElaMutation.isPending}
                  onClick={() => rerunElaMutation.mutate()}
                >
                  Re-run ELA Forensics
                </Button>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-blue-900">Digital Receipt Forensics (ELA)</CardTitle>
          <CardDescription className="text-blue-700/80">
            Error Level Analysis detects inconsistencies in pixel density that occur when scammers alter
            numbers or dates on payment screenshots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminJsonInspect
            data={forensicsQuery.data}
            isPending={forensicsQuery.isPending}
            errorMessage={
              forensicsQuery.isError && forensicsQuery.error instanceof Error
                ? forensicsQuery.error.message
                : null
            }
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-purple-900">Conversational Intent Classifier</CardTitle>
          <CardDescription className="text-purple-700/80">
            Uses Gemini NLP to analyze transaction chat logs for linguistic markers indicating &quot;Artificial
            Urgency&quot; or &quot;Platform Circumvention&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={analyzeChatMutation.isPending}
            onClick={() => analyzeChatMutation.mutate()}
          >
            {analyzeChatMutation.isPending ? 'Analyzing...' : 'Run Chat Analysis'}
          </Button>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-purple-900">Stored analyses</h4>
            <AdminJsonInspect
              data={analysesQuery.data}
              isPending={analysesQuery.isPending}
              errorMessage={
                analysesQuery.isError && analysesQuery.error instanceof Error
                  ? analysesQuery.error.message
                  : null
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
