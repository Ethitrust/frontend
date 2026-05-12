'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

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
import { Bot, FileText, ImageIcon, ShieldAlert } from 'lucide-react'
import {
  fetchAdminDisputeAnalyses,
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

type ChatAnalysisItem = {
  id: string
  provider: string
  model: string
  status: string
  risk_level: string | null
  detected_intents: string[] | null
  flagged_messages: unknown[] | null
  summary: string | null
  recommendation: string | null
  error: string | null
  message_count_analyzed: number
  created_at: string
  completed_at: string | null
}

type ChatAnalysesResponse = {
  analyses?: ChatAnalysisItem[] | null
  total?: number | null
}

/** Best-effort extraction of evidence identifiers from the thread payload. */
function extractEvidenceOptions(threadData: unknown): { id: string; label: string }[] {
  if (!threadData || typeof threadData !== 'object') return []
  const data = threadData as Record<string, unknown>

  const fromArray = (arr: unknown[]) =>
    arr
      .map((ev) => {
        if (typeof ev === 'string') return { id: ev, label: ev }
        if (!ev || typeof ev !== 'object') return null
        const e = ev as Record<string, unknown>
        const id = String(e.evidence_id ?? e.id ?? e.evidenceId ?? '')
        if (!id) return null
        const name = String(
          e.filename ?? e.file_name ?? e.object_key ?? e.type ?? e.label ?? e.name ?? '',
        )
        return {
          id,
          label: name && name !== id ? `${filenameFromKey(name)} (${id.slice(0, 8)}...)` : id,
        }
      })
      .filter((x): x is { id: string; label: string } => Boolean(x && x.id))

  if (Array.isArray(data.evidence)) return fromArray(data.evidence)
  if (Array.isArray(data.evidence_items)) return fromArray(data.evidence_items)
  if (Array.isArray(data.evidence_ids)) {
    return data.evidence_ids
      .filter((id): id is string => typeof id === 'string')
      .map((id) => ({ id, label: id }))
  }

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

function filenameFromKey(key: string) {
  return key.split('/').pop() || key
}

function isRenderableUrl(url: string | null | undefined) {
  if (!url) return false
  return /^https?:\/\//i.test(url) || url.startsWith('/')
}

function mediaUrl(url: string | null | undefined) {
  return isRenderableUrl(url) ? url : null
}

function getEvidenceVerdict(result?: Pick<ForensicsEvidenceResult, 'ela_score' | 'ela_status' | 'is_tampered' | 'ela_error'> | null) {
  if (!result) {
    return {
      label: 'Not analyzed',
      detail: 'No image forensics result is available yet.',
      className: 'bg-muted text-muted-foreground',
    }
  }
  if (result.ela_error) {
    return {
      label: 'Analysis failed',
      detail: 'The image could not be checked. Re-run analysis before making a decision.',
      className: 'bg-red-100 text-red-700',
    }
  }
  if (result.is_tampered || (result.ela_score ?? 0) >= 0.6) {
    return {
      label: 'Definitely edited',
      detail: 'Strong pixel inconsistencies were detected. Review the highlighted heatmap area.',
      className: 'bg-red-100 text-red-700',
    }
  }
  if ((result.ela_score ?? 0) >= 0.28) {
    return {
      label: 'Likely edited',
      detail: 'The heatmap shows suspicious compression differences that may indicate modification.',
      className: 'bg-amber-100 text-amber-800',
    }
  }
  if ((result.ela_score ?? 0) >= 0.12) {
    return {
      label: 'Needs review',
      detail: 'Some artifacts were found, but they are not conclusive on their own.',
      className: 'bg-sky-100 text-sky-800',
    }
  }
  if (result.ela_status?.toLowerCase() === 'completed') {
    return {
      label: 'No clear edit detected',
      detail: 'The image does not show strong signs of manipulation in the current analysis.',
      className: 'bg-emerald-100 text-emerald-800',
    }
  }
  return {
    label: 'Analysis pending',
    detail: 'The image is queued or still being processed.',
    className: 'bg-amber-100 text-amber-800',
  }
}

function ImagePreview({
  src,
  alt,
  className,
  emptyLabel = 'Image unavailable',
}: {
  src?: string | null
  alt: string
  className?: string
  emptyLabel?: string
}) {
  const [failed, setFailed] = useState(false)
  const resolvedSrc = mediaUrl(src)

  if (!resolvedSrc || failed) {
    return (
      <div className={cn('flex items-center justify-center rounded-md bg-background text-muted-foreground', className)}>
        <div className="px-4 text-center">
          <ImageIcon className="mx-auto size-6" aria-hidden />
          <p className="mt-2 text-xs">{emptyLabel}</p>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
            >
              Open file
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={cn('rounded-md bg-background object-contain', className)}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

type ThreadMessageReplyPreview = {
  message_id: string
  text: string
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
  reply_to_message?: ThreadMessageReplyPreview | null
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

function formatDateTime(iso: string | null) {
  return iso
    ? new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    : '-'
}

function roleBadgeClass(role: string | null) {
  switch (role?.toLowerCase()) {
    case 'buyer':
      return 'bg-sky-100 text-sky-800'
    case 'seller':
      return 'bg-emerald-100 text-emerald-800'
    case 'moderator':
    case 'admin':
      return 'bg-violet-100 text-violet-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function PartyChannelChat({
  label,
  role,
  partyId,
  mediatorId,
  messages,
  evidence,
  forensicsData,
}: {
  label: string
  role: 'buyer' | 'seller'
  partyId: string | null
  mediatorId: string | null
  messages: ThreadMessage[]
  evidence: ThreadEvidence[]
  forensicsData?: ForensicsResponse | null
}) {
  // Filter to messages in this private channel:
  // sender=party & recipient=mediator, or sender=mediator & recipient=party,
  // or system (recipient_id null — visible to all)
  const channelMessages = messages.filter((m) => {
    const senderId = m.sender_id
    const recipientId = (m as ThreadMessage & { recipient_id?: string | null }).recipient_id ?? null
    if (recipientId === null) return true // system / legacy
    if (!partyId) return true
    return (
      (senderId === partyId && recipientId === mediatorId) ||
      (senderId === mediatorId && recipientId === partyId)
    )
  }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const forensicsByEvidenceId = new Map(
    (forensicsData?.evidence_results ?? []).map((result) => [result.evidence_id, result]),
  )
  const evidenceByMessage = new Map<string, ThreadEvidence[]>()
  evidence.forEach((ev) => {
    if (!ev.message_id) return
    evidenceByMessage.set(ev.message_id, [...(evidenceByMessage.get(ev.message_id) ?? []), ev])
  })

  const initials = (name: string | null) =>
    (name || '?')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const EvidenceAttachment = ({ ev }: { ev: ThreadEvidence }) => {
    const isImage = ev.file_type?.startsWith('image/')
    const verdict = getEvidenceVerdict(forensicsByEvidenceId.get(ev.id))
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-background/80">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/25 px-3 py-2">
          <p className="truncate text-xs font-medium text-foreground">{filenameFromKey(ev.object_key)}</p>
          {forensicsByEvidenceId.has(ev.id) && (
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', verdict.className)}>
              {verdict.label}
            </span>
          )}
        </div>
        {isImage ? (
          <div className="bg-muted/20 p-3">
            <ImagePreview src={ev.file_url} alt={ev.object_key} className="h-36 w-full" />
          </div>
        ) : (
          <a href={ev.file_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 p-3 text-sm font-medium text-primary hover:underline">
            <FileText className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{filenameFromKey(ev.object_key)}</span>
          </a>
        )}
      </div>
    )
  }

  const headerColor = role === 'buyer' ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  return (
    <div className="flex flex-1 min-w-0 flex-col rounded-xl border border-border overflow-hidden">
      <div className={cn('flex items-center gap-2 border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wider', headerColor)}>
        <span>{label}</span>
        <span className="ml-auto opacity-60">{channelMessages.length} messages</span>
      </div>
      <div className="max-h-[600px] flex-1 space-y-3 overflow-y-auto bg-muted/10 p-3">
        {channelMessages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No messages in this channel yet.</p>
        ) : (
          channelMessages.map((msg) => {
            const attached = evidenceByMessage.get(msg.id) ?? []
            const isMediator = msg.sender_id === mediatorId
            return (
              <article key={msg.id} className={cn('flex gap-2', isMediator && 'flex-row-reverse')}>
                <div className={cn(
                  'mt-4 flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  isMediator ? 'bg-violet-100 text-violet-800' : roleBadgeClass(msg.sender_role),
                )}>
                  {initials(msg.sender_name)}
                </div>
                <div className={cn('min-w-0 max-w-[85%] space-y-1')}>
                  <div className={cn('flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground', isMediator && 'justify-end')}>
                    <span className="font-semibold text-foreground">{msg.sender_name || 'Unknown'}</span>
                    {msg.sender_role && (
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase', roleBadgeClass(msg.sender_role))}>
                        {msg.sender_role}
                      </span>
                    )}
                    <span>{formatDateTime(msg.created_at)}</span>
                  </div>
                  <div className={cn(
                    'rounded-2xl border px-3 py-2 text-xs leading-relaxed shadow-sm whitespace-pre-wrap',
                    isMediator
                      ? 'rounded-tr-md border-primary/20 bg-primary text-primary-foreground'
                      : 'rounded-tl-md border-border bg-card text-foreground',
                  )}>
                    {msg.message}
                  </div>
                  {attached.length > 0 && (
                    <div className="grid gap-2 pt-1 sm:grid-cols-1">
                      {attached.map((ev) => <EvidenceAttachment key={ev.id} ev={ev} />)}
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

function ThreadSnapshotChat({
  data,
  forensicsData,
  isPending,
  errorMessage,
}: {
  data: unknown
  forensicsData?: unknown
  isPending?: boolean
  errorMessage?: string | null
}) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-4/5 rounded-xl" />
        <Skeleton className="ml-auto h-20 w-3/5 rounded-xl" />
        <Skeleton className="h-24 w-2/3 rounded-xl" />
      </div>
    )
  }
  if (errorMessage) return <p className="text-sm text-destructive">{errorMessage}</p>

  const payload = data as {
    messages?: (ThreadMessage & { recipient_id?: string | null })[]
    evidence?: ThreadEvidence[]
    participants?: { user_id: string; role: string }[]
  } | null
  const forensicsPayload = forensicsData as ForensicsResponse | null
  const messages = [...(payload?.messages ?? [])]
  const evidence = payload?.evidence ?? []
  const participants = payload?.participants ?? []

  if (messages.length === 0 && evidence.length === 0) {
    return <p className="text-sm text-muted-foreground">No thread data available.</p>
  }

  // Determine party IDs from participant list
  const buyerParticipant = participants.find((p) => p.role === 'buyer')
  const sellerParticipant = participants.find((p) => p.role === 'seller')
  const mediatorParticipant = participants.find((p) => p.role === 'mediator' || p.role === 'moderator')

  const buyerId = buyerParticipant?.user_id ?? null
  const sellerId = sellerParticipant?.user_id ?? null
  const mediatorId = mediatorParticipant?.user_id ?? null

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Messages are split by private channel. Each side only sees its own conversation with the moderator.
      </p>
      <div className="flex flex-col gap-4 lg:flex-row">
        <PartyChannelChat
          label="Buyer channel"
          role="buyer"
          partyId={buyerId}
          mediatorId={mediatorId}
          messages={messages}
          evidence={evidence}
          forensicsData={forensicsPayload}
        />
        <PartyChannelChat
          label="Seller channel"
          role="seller"
          partyId={sellerId}
          mediatorId={mediatorId}
          messages={messages}
          evidence={evidence}
          forensicsData={forensicsPayload}
        />
      </div>
    </div>
  )
}

function ForensicsResultsView({
  data,
  threadData,
  isPending,
  errorMessage,
}: {
  data: unknown
  threadData?: unknown
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

  const threadPayload = threadData as { evidence?: ThreadEvidence[] } | null
  const evidenceById = new Map((threadPayload?.evidence ?? []).map((ev) => [ev.id, ev]))
  const evidenceByKey = new Map((threadPayload?.evidence ?? []).map((ev) => [ev.object_key, ev]))

  return (
    <div className="space-y-4">
      {results.map((ev) => {
        const verdict = getEvidenceVerdict(ev)
        return (
          <div
            key={ev.evidence_id}
            className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground" title={filenameFromKey(ev.object_key)}>
                  {filenameFromKey(ev.object_key)}
                </p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">{ev.evidence_id}</p>
              </div>
              <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', verdict.className)}>
                {verdict.label}
              </span>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-px bg-border md:grid-cols-2">
                {(() => {
                  const original = evidenceById.get(ev.evidence_id) ?? evidenceByKey.get(ev.object_key)
                  const imagePanels = [
                    {
                      label: 'Original',
                      url: original?.file_url,
                      icon: ImageIcon,
                      emptyLabel: 'Original image could not be displayed',
                    },
                    {
                      label: 'Likely edited areas',
                      url: ev.heatmap_url,
                      icon: ShieldAlert,
                      emptyLabel: 'Heatmap is not available yet',
                    },
                  ]

                  return imagePanels.map((panel) => {
                    const Icon = panel.icon
                    return (
                      <div key={panel.label} className="bg-muted/20 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {panel.label}
                          </span>
                          {panel.url && (
                            <a
                              href={panel.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-medium text-primary hover:underline"
                            >
                              Open
                            </a>
                          )}
                        </div>
                        {mediaUrl(panel.url) ? (
                          <ImagePreview
                            src={panel.url}
                            alt={`${panel.label} for ${filenameFromKey(ev.object_key)}`}
                            className="h-72 w-full"
                            emptyLabel={panel.emptyLabel}
                          />
                        ) : (
                          <div className="flex h-72 items-center justify-center rounded-md bg-background text-muted-foreground">
                            <div className="text-center">
                              <Icon className="mx-auto size-6" aria-hidden />
                              <p className="mt-2 text-xs">{panel.emptyLabel}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>

              <div className="flex flex-col justify-center space-y-4 p-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Decision cue
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{verdict.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{verdict.detail}</p>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <span>File type</span>
                    <span className="font-medium text-foreground">{ev.file_type}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Completed</span>
                    <span className="text-right font-medium text-foreground">{formatDateTime(ev.ela_completed_at)}</span>
                  </div>
                  {ev.heatmap_object_key && (
                    <div className="flex justify-between gap-3">
                      <span>Heatmap</span>
                      <span className="max-w-[12rem] truncate font-mono text-[10px] text-foreground" title={ev.heatmap_object_key}>
                        {filenameFromKey(ev.heatmap_object_key)}
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

                {Boolean(ev.tamper_metadata) && (
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
        )
      })}
      <p className="text-xs text-muted-foreground">Total results: {payload?.total ?? results.length}</p>
    </div>
  )
}

function latestUsableAnalysis(data: unknown) {
  const payload = data as ChatAnalysesResponse | null
  const analyses = payload?.analyses ?? []
  return [...analyses]
    .filter((analysis) => {
      const source = `${analysis.provider} ${analysis.model}`.toLowerCase()
      return analysis.status?.toLowerCase() === 'completed' && !analysis.error && /grok|xai/.test(source)
    })
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.created_at).getTime() -
        new Date(a.completed_at ?? a.created_at).getTime(),
    )[0]
}

function CaseSummaryCard({
  threadData,
  forensicsData,
  analysesData,
  isPending,
}: {
  threadData: unknown
  forensicsData: unknown
  analysesData: unknown
  isPending?: boolean
}) {
  if (isPending) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  const thread = threadData as { messages?: ThreadMessage[]; evidence?: ThreadEvidence[] } | null
  const forensics = forensicsData as ForensicsResponse | null
  const analysis = latestUsableAnalysis(analysesData)
  const messages = thread?.messages ?? []
  const evidence = thread?.evidence ?? []
  const evidenceResults = forensics?.evidence_results ?? []
  const editedCount = evidenceResults.filter((result) =>
    ['Definitely edited', 'Likely edited'].includes(getEvidenceVerdict(result).label),
  ).length
  const participants = Array.from(
    new Set(messages.map((msg) => msg.sender_role).filter((role): role is string => Boolean(role))),
  )

  const summary =
    analysis?.summary ||
    `This dispute has ${messages.length} message${messages.length === 1 ? '' : 's'} and ${evidence.length} evidence item${evidence.length === 1 ? '' : 's'} from ${participants.length ? participants.join(', ') : 'the parties'}.`

  const recommendation =
    analysis?.recommendation ||
    (editedCount > 0
      ? 'Review the highlighted evidence before deciding the case.'
      : 'Continue mediation and request clearer evidence if the current record is not enough.')

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Case summary</CardTitle>
        <CardDescription>A quick read before reviewing the full chat and evidence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-muted/25 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Messages</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{messages.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/25 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{evidence.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/25 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Edited</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{editedCount}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{summary}</p>
        </div>

        <div className="rounded-lg border border-border bg-muted/25 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next step</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{recommendation}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function GrokCaseAnalysisView({
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
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    )
  }
  if (errorMessage) return <p className="text-sm text-destructive">{errorMessage}</p>

  const analysis = latestUsableAnalysis(data)
  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
        No Grok case summary is available yet. Run analysis after the parties have added their latest messages.
      </div>
    )
  }

  const flaggedCount = Array.isArray(analysis.flagged_messages) ? analysis.flagged_messages.length : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
          <Bot className="size-3" aria-hidden />
          Grok summary
        </span>
        {analysis.risk_level && (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              analysis.risk_level.toLowerCase() === 'high' && 'bg-red-100 text-red-700',
              analysis.risk_level.toLowerCase() === 'medium' && 'bg-amber-100 text-amber-800',
              analysis.risk_level.toLowerCase() === 'low' && 'bg-emerald-100 text-emerald-800',
              !['high', 'medium', 'low'].includes(analysis.risk_level.toLowerCase()) &&
                'bg-muted text-muted-foreground',
            )}
          >
            {analysis.risk_level} risk
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {analysis.message_count_analyzed} messages reviewed
        </span>
      </div>

      {analysis.summary && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{analysis.summary}</p>
        </div>
      )}

      {analysis.recommendation && (
        <div className="rounded-xl border border-border bg-muted/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommendation</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {analysis.recommendation}
          </p>
        </div>
      )}

      {Array.isArray(analysis.detected_intents) && analysis.detected_intents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {analysis.detected_intents.map((intent) => (
            <span
              key={intent}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
            >
              {intent}
            </span>
          ))}
        </div>
      )}

      {flaggedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {flaggedCount} message{flaggedCount === 1 ? '' : 's'} need closer review in the conversation above.
        </p>
      )}
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

  const analysesQuery = useQuery({
    queryKey: ['admin', 'disputes', disputeId, 'analyses'],
    queryFn: () => fetchAdminDisputeAnalyses(accessToken, disputeId),
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

  const invalidateAnalyses = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'disputes', disputeId, 'analyses'] })
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Conversation</CardTitle>
              <CardDescription>Classic chat view with party messages and evidence in context.</CardDescription>
            </CardHeader>
            <CardContent>
              <ThreadSnapshotChat
                data={threadQuery.data}
                forensicsData={forensicsQuery.data}
                isPending={threadQuery.isPending}
                errorMessage={threadErr}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Image analysis</CardTitle>
              <CardDescription>
                Original image and ELA heatmap are displayed side by side for faster visual review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForensicsResultsView
                data={forensicsQuery.data}
                threadData={threadQuery.data}
                isPending={forensicsQuery.isPending}
                errorMessage={
                  forensicsQuery.isError && forensicsQuery.error instanceof Error
                    ? forensicsQuery.error.message
                    : null
                }
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Grok case summary</CardTitle>
                <CardDescription>
                  Plain-language summary and recommendation from the latest completed analysis.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={analyzeChatMutation.isPending}
                onClick={() => analyzeChatMutation.mutate()}
                className="shrink-0"
              >
                {analyzeChatMutation.isPending ? 'Summarizing...' : 'Refresh summary'}
              </Button>
            </CardHeader>
            <CardContent>
              <GrokCaseAnalysisView
                data={analysesQuery.data}
                isPending={analysesQuery.isPending}
                errorMessage={
                  analysesQuery.isError && analysesQuery.error instanceof Error
                    ? analysesQuery.error.message
                    : null
                }
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <CaseSummaryCard
            threadData={threadQuery.data}
            forensicsData={forensicsQuery.data}
            analysesData={analysesQuery.data}
            isPending={threadQuery.isPending || forensicsQuery.isPending || analysesQuery.isPending}
          />

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Workflow tools</CardTitle>
              <CardDescription>Admin actions for assignment, notes, and case state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Assign mediator</h3>
                <div className="space-y-2">
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
                  className="w-full"
                  disabled={!mediatorId.trim() || mediatorMutation.isPending}
                  onClick={() => mediatorMutation.mutate()}
                >
                  Assign mediator
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-5">
                <h3 className="text-sm font-semibold text-foreground">Resolution note</h3>
                <Textarea
                  rows={4}
                  value={resolutionNote}
                  onChange={(ev) => setResolutionNote(ev.target.value)}
                  placeholder="Internal note surfaced on the dispute ledger"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={noteMutation.isPending}
                  onClick={() => noteMutation.mutate()}
                >
                  Add note
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-5">
                <h3 className="text-sm font-semibold text-foreground">Apply action</h3>
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
                  rows={3}
                  value={disputeActionNote}
                  onChange={(ev) => setDisputeActionNote(ev.target.value)}
                  placeholder="Optional moderator context"
                />
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate()}
                >
                  Submit action
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Evidence integrity</CardTitle>
              <CardDescription>Select evidence from the thread, then update disposition or re-run ELA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const evidenceOptions = extractEvidenceOptions(threadQuery.data)
                if (threadQuery.isPending) {
                  return <Skeleton className="h-9 w-full" />
                }
                if (evidenceOptions.length > 0) {
                  return (
                    <div className="space-y-2">
                      <Label>Evidence</Label>
                      <Select value={evidenceId} onValueChange={setEvidenceId}>
                        <SelectTrigger size="sm" className="w-full cursor-pointer">
                          <SelectValue placeholder="Choose evidence" />
                        </SelectTrigger>
                        <SelectContent>
                          {evidenceOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                }
                return (
                  <div className="space-y-2">
                    <Label htmlFor="ev-id">Evidence id</Label>
                    <Input
                      id="ev-id"
                      value={evidenceId}
                      onChange={(ev) => setEvidenceId(ev.target.value)}
                      placeholder="UUID"
                    />
                  </div>
                )
              })()}

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
                <Textarea
                  id="ev-meta"
                  rows={4}
                  value={evidenceMetaJson}
                  onChange={(ev) => setEvidenceMetaJson(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
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
                  Re-run ELA forensics
                </Button>
              </div>
              <Alert>
                <AlertTitle>Review cue</AlertTitle>
                <AlertDescription className="text-xs">
                  Use the visual panel before marking evidence so the audit record matches the reviewed artifact.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
