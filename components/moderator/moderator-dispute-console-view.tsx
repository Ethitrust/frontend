'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { ChatAnalysesView } from '@/components/admin/chat-analyses-view'
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

type ThreadMessage = {
  id: string
  sender_id: string
  sender_name: string | null
  sender_email: string | null
  sender_role: string | null
  message_type: string
  message: string
  created_at: string
}

type ThreadEvidence = {
  id: string
  message_id: string | null
  uploaded_by: string
  uploaded_by_name: string | null
  uploaded_by_email: string | null
  uploaded_by_role: string | null
  object_key: string
  file_url: string
  file_type: string
  is_tampered: boolean | null
  tamper_metadata: unknown
  ela_status: string | null
  ela_score: number | null
  heatmap_object_key: string | null
}

function ThreadSnapshotChat({
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
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    )
  }
  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>
  }

  const payload = data as {
    messages?: ThreadMessage[]
    evidence?: ThreadEvidence[]
  } | null

  const messages = payload?.messages ?? []
  const evidenceList = payload?.evidence ?? []

  if (messages.length === 0 && evidenceList.length === 0) {
    return <p className="text-sm text-muted-foreground">No thread data available.</p>
  }

  const sortedMessages = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const evidenceByMessage = new Map<string, ThreadEvidence[]>()
  const orphanedEvidence: ThreadEvidence[] = []

  evidenceList.forEach((ev) => {
    if (ev.message_id) {
      const arr = evidenceByMessage.get(ev.message_id)
      if (arr) arr.push(ev)
      else evidenceByMessage.set(ev.message_id, [ev])
    } else {
      orphanedEvidence.push(ev)
    }
  })

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))

  const initials = (name: string | null) =>
    (name || '?')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const roleBadgeClass = (role: string | null) => {
    switch (role?.toLowerCase()) {
      case 'buyer':
        return 'bg-blue-100 text-blue-800'
      case 'seller':
        return 'bg-emerald-100 text-emerald-800'
      case 'moderator':
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="max-h-[min(70vh,560px)] overflow-auto space-y-6 pr-2">
      {sortedMessages.map((msg) => {
        const attached = evidenceByMessage.get(msg.id) ?? []
        return (
          <div key={msg.id} className="flex gap-3">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                roleBadgeClass(msg.sender_role)
              )}
            >
              {initials(msg.sender_name)}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {msg.sender_name || 'Unknown'}
                </span>
                {msg.sender_role && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                      roleBadgeClass(msg.sender_role)
                    )}
                  >
                    {msg.sender_role}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {msg.sender_email}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatTime(msg.created_at)}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground whitespace-pre-wrap">
                {msg.message}
              </div>

              {attached.length > 0 && (
                <div className="space-y-2">
                  {attached.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-border bg-background p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Evidence from {ev.uploaded_by_name || 'Unknown'}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                            roleBadgeClass(ev.uploaded_by_role)
                          )}
                        >
                          {ev.uploaded_by_role || 'unknown role'}
                        </span>
                      </div>

                      {ev.file_type?.startsWith('image/') ? (
                        <div className="space-y-2">
                          <a
                            href={ev.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={ev.file_url}
                              alt={ev.object_key}
                              className="max-h-64 rounded-md border object-contain"
                              loading="lazy"
                            />
                          </a>
                          <div className="flex flex-wrap gap-2">
                            {ev.is_tampered && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                                Tampered
                              </span>
                            )}
                            {ev.ela_status && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                ELA: {ev.ela_status}
                              </span>
                            )}
                            {ev.ela_score !== null && ev.ela_score !== undefined && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                Score: {ev.ela_score}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <a
                              href={ev.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-sm font-medium text-primary hover:underline"
                            >
                              {ev.object_key.split('/').pop() || ev.object_key}
                            </a>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {ev.is_tampered && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                                  Tampered
                                </span>
                              )}
                              {ev.ela_status && (
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                  ELA: {ev.ela_status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {orphanedEvidence.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Evidence without linked message
          </h4>
          {orphanedEvidence.map((ev) => (
            <div
              key={ev.id}
              className="rounded-lg border border-border bg-background p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Evidence from {ev.uploaded_by_name || 'Unknown'}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    roleBadgeClass(ev.uploaded_by_role)
                  )}
                >
                  {ev.uploaded_by_role || 'unknown role'}
                </span>
              </div>
              {ev.file_type?.startsWith('image/') ? (
                <a
                  href={ev.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={ev.file_url}
                    alt={ev.object_key}
                    className="max-h-64 rounded-md border object-contain"
                    loading="lazy"
                  />
                </a>
              ) : (
                <a
                  href={ev.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-medium text-primary hover:underline"
                >
                  {ev.object_key.split('/').pop() || ev.object_key}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
          <CardDescription>Chronological chat transcript with attached evidence.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThreadSnapshotChat
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
          <ForensicsResultsView
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
            <ChatAnalysesView
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
