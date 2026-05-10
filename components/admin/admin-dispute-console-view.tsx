'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { ChatAnalysesView } from '@/components/admin/chat-analyses-view'
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
import { Input } from '@/components/ui/input'
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
  postAdminDisputeAction,
  postAdminDisputeAssignMediator,
  postAdminDisputeEvidenceTamper,
  postAdminDisputeResolutionNote,
  fetchAdminDisputeForensics,
  postAdminDisputeAnalyzeChat,
  postAdminEvidenceRerunEla,
} from '@/lib/admin/admin-platform-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

type ForensicsEvidenceResult = {
  evidence_id: string
  dispute_id: string
  object_key: string
  file_type: string
  ela_status: string
  ela_score: number | null
  heatmap_object_key: string | null
  heatmap_url: string | null
  is_tampered: boolean | null
  tamper_metadata: unknown
  ela_error: string | null
  ela_completed_at: string | null
}

type ForensicsResponse = {
  dispute_id: string
  evidence_results: ForensicsEvidenceResult[]
  total: number
}

function ForensicsResultsView({
  data,
  isPending,
  errorMessage,
}: {
  data: unknown
  isPending?: boolean
  errorMessage?: string | null
}) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>
  }

  const payload = data as ForensicsResponse | null
  const results = payload?.evidence_results ?? []

  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No forensics results available.</p>
  }

  const formatTime = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(iso))
      : '—'

  const filename = (key: string) => key.split('/').pop() || key

  const statusBadge = (status: string, error: string | null) => {
    if (error) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
          Failed
        </span>
      )
    }
    const s = status.toLowerCase()
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          Completed
        </span>
      )
    }
    if (s === 'pending' || s === 'running' || s === 'queued') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          {status}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        {status}
      </span>
    )
  }

  const scoreBar = (score: number | null) => {
    if (score === null || score === undefined) return null
    const pct = Math.min(Math.max(score * 100, 0), 100)
    let barColor = 'bg-emerald-500'
    if (pct > 30) barColor = 'bg-amber-500'
    if (pct > 60) barColor = 'bg-red-500'
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">ELA Score</span>
          <span className="font-semibold tabular-nums text-foreground">{score.toFixed(4)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn('h-2 rounded-full', barColor)} style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((ev) => (
        <div
          key={ev.evidence_id}
          className="rounded-lg border border-border bg-background p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground" title={filename(ev.object_key)}>
                {filename(ev.object_key)}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{ev.evidence_id}</p>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(ev.ela_status, ev.ela_error)}
              {ev.is_tampered && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  Tampered
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ev.heatmap_url && (
              <a
                href={ev.heatmap_url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={ev.heatmap_url}
                  alt={`ELA heatmap for ${filename(ev.object_key)}`}
                  className="max-h-48 w-full rounded-md border object-contain"
                  loading="lazy"
                />
                <p className="mt-1 text-[10px] text-center text-muted-foreground">ELA Heatmap</p>
              </a>
            )}

            <div className="flex flex-col justify-center space-y-3">
              {scoreBar(ev.ela_score)}

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>File type</span>
                  <span className="font-medium text-foreground">{ev.file_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-medium text-foreground">{formatTime(ev.ela_completed_at)}</span>
                </div>
                {ev.heatmap_object_key && (
                  <div className="flex justify-between">
                    <span>Heatmap key</span>
                    <span className="truncate max-w-[12rem] font-mono text-[10px] text-foreground" title={ev.heatmap_object_key}>
                      {filename(ev.heatmap_object_key)}
                    </span>
                  </div>
                )}
              </div>

              {ev.ela_error && (
                <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
                  <p className="font-semibold">Error</p>
                  <p>{ev.ela_error}</p>
                </div>
              )}

              {ev.tamper_metadata && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Tamper metadata
                  </summary>
                  <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-muted/40 p-2 text-[10px] font-mono whitespace-pre-wrap">
                    {JSON.stringify(ev.tamper_metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Total results: {payload?.total ?? results.length}</p>
    </div>
  )
}

export function AdminDisputeConsoleView({
  accessToken,
  disputeId,
}: {
  accessToken: string
  disputeId: string
}) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()

  const threadQuery = useQuery({
    queryKey: ['admin', 'disputes', disputeId, 'thread'],
    queryFn: () => fetchAdminDisputeThread(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  })

  const forensicsQuery = useQuery({
    queryKey: ['admin', 'disputes', disputeId, 'forensics'],
    queryFn: () => fetchAdminDisputeForensics(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  })

  const [mediatorId, setMediatorId] = useState('')
  const [resolutionNote, setResolutionNote] = useState('')
  const [disputeAction, setDisputeAction] = useState('escalate')
  const [disputeActionNote, setDisputeActionNote] = useState('')
  const [evidenceId, setEvidenceId] = useState('')
  const [evidenceTampered, setEvidenceTampered] = useState(true)
  const [evidenceMetaJson, setEvidenceMetaJson] = useState('{}')

  const invalidateThread = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'disputes', disputeId, 'thread'] })
  }

  const invalidateForensics = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'disputes', disputeId, 'forensics'] })
  }

  const mediatorMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeAssignMediator(accessToken, disputeId, {
        mediator_user_id: mediatorId.trim(),
      }),
    onSuccess: () => {
      toast.success('Mediator assigned')
      setMediatorId('')
      invalidateThread()
    },
    onError: (err: Error) => toast.error(err.message),
  })

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

  const actionMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeAction(accessToken, disputeId, {
        action: disputeAction,
        note: disputeActionNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Dispute action applied')
      setDisputeActionNote('')
      invalidateThread()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const tamperMutation = useMutation({
    mutationFn: () => {
      let metadata: Record<string, unknown> | undefined
      try {
        const parsed = JSON.parse(evidenceMetaJson || '{}') as unknown
        metadata = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
      } catch {
        throw new Error('Evidence metadata must be valid JSON')
      }
      return postAdminDisputeEvidenceTamper(accessToken, evidenceId.trim(), {
        is_tampered: evidenceTampered,
        metadata,
      })
    },
    onSuccess: () => {
      toast.success('Evidence tamper flag recorded')
      invalidateThread()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const analyzeChatMutation = useMutation({
    mutationFn: () => postAdminDisputeAnalyzeChat(accessToken, disputeId),
    onSuccess: () => {
      toast.success('Chat analysis complete')
      invalidateThread()
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
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Dispute console
          </h1>
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{disputeId}</p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/admin/disputes">Back to disputes</Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Thread snapshot</CardTitle>
          <CardDescription>Latest serialized thread export for operators.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminJsonInspect data={threadQuery.data} isPending={threadQuery.isPending} errorMessage={threadErr} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Workflow tools</CardTitle>
          <CardDescription>Dedicated POST envelopes for moderator tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Assign mediator</h3>
            <div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
              <div className="grow space-y-2">
                <Label htmlFor="med-id">Mediator user id</Label>
                <Input
                  id="med-id"
                  value={mediatorId}
                  onChange={(ev) => setMediatorId(ev.target.value)}
                  placeholder="UUID"
                />
              </div>
              <Button
                type="button"
                disabled={!mediatorId.trim() || mediatorMutation.isPending}
                onClick={() => mediatorMutation.mutate()}
              >
                Assign
              </Button>
            </div>
          </div>

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

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Apply dispute action</h3>
            <div className="grid max-w-xl gap-3">
              <div className="space-y-2">
                <Label>Action code</Label>
                <Select value={disputeAction} onValueChange={setDisputeAction}>
                  <SelectTrigger size="sm" className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escalate">Escalate</SelectItem>
                    <SelectItem value="close">Close</SelectItem>
                    <SelectItem value="resume_negotiation">Resume negotiation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                rows={2}
                value={disputeActionNote}
                onChange={(ev) => setDisputeActionNote(ev.target.value)}
                placeholder="Optional moderator context"
              />
              <Button
                type="button"
                variant="destructive"
                disabled={actionMutation.isPending}
                onClick={() => actionMutation.mutate()}
              >
                Submit action
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Evidence integrity</CardTitle>
          <CardDescription>
            When you know an evidence bundle id from the thread, record tamper disposition with optional JSON metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-xl space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ev-id">Evidence id</Label>
            <Input id="ev-id" value={evidenceId} onChange={(ev) => setEvidenceId(ev.target.value)} placeholder="UUID" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="ev-tamp"
              type="checkbox"
              className="size-4 rounded border border-input"
              checked={evidenceTampered}
              onChange={(ev) => setEvidenceTampered(ev.target.checked)}
            />
            <Label htmlFor="ev-tamp">Mark as tampered</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-meta">Metadata JSON</Label>
            <Textarea id="ev-meta" rows={3} value={evidenceMetaJson} onChange={(ev) => setEvidenceMetaJson(ev.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!evidenceId.trim() || tamperMutation.isPending}
              onClick={() => tamperMutation.mutate()}
            >
              Submit evidence update
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!evidenceId.trim() || rerunElaMutation.isPending}
              onClick={() => rerunElaMutation.mutate()}
            >
              Re-run ELA Forensics
            </Button>
          </div>
          <Alert>
            <AlertTitle>Thread parsing</AlertTitle>
            <AlertDescription className="text-xs">
              Auto-extraction of evidence identifiers from unstructured thread payloads may arrive in a future iteration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-blue-900">Digital Receipt Forensics (ELA)</CardTitle>
          <CardDescription className="text-blue-700/80">
            Error Level Analysis detects inconsistencies in pixel density that occur when scammers alter numbers or dates on payment screenshots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForensicsResultsView
            data={forensicsQuery.data}
            isPending={forensicsQuery.isPending}
            errorMessage={forensicsQuery.isError && forensicsQuery.error instanceof Error ? forensicsQuery.error.message : null}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-purple-900">Conversational Intent Classifier</CardTitle>
          <CardDescription className="text-purple-700/80">
            Uses Gemini NLP to analyze transaction chat logs for linguistic markers indicating &quot;Artificial Urgency&quot; or &quot;Platform Circumvention&quot;.
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
        </CardContent>
      </Card>
    </div>
  )
}
