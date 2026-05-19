'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ChatAnalysisIntentEntry = {
  message_index?: number | null
  message_id?: string | null
  quote?: string | null
  explanation?: string | null
}

type ChatAnalysisFlaggedMessage = {
  message_index?: number | null
  message_id?: string | null
  category?: string | null
  quote?: string | null
  explanation?: string | null
}

type ChatAnalysisItem = {
  id: string
  dispute_id: string
  requested_by: string
  provider: string
  model: string
  status: string
  risk_level: string | null
  detected_intents:
    | Record<string, ChatAnalysisIntentEntry[] | null | undefined>
    | string[]
    | null
  flagged_messages: ChatAnalysisFlaggedMessage[] | null
  summary: string | null
  recommendation: string | null
  error: string | null
  message_count_analyzed: number
  created_at: string
  completed_at: string | null
}

function formatIntentLabel(key: string) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function normalizeDetectedIntents(
  detected: ChatAnalysisItem['detected_intents'],
): Array<{ key: string; label: string; count: number }> {
  if (!detected) return []
  if (Array.isArray(detected)) {
    return detected
      .filter((item): item is string => typeof item === 'string' && item.length > 0)
      .map((item) => ({ key: item, label: formatIntentLabel(item), count: 0 }))
  }
  if (typeof detected === 'object') {
    return Object.entries(
      detected as Record<string, ChatAnalysisIntentEntry[] | null | undefined>,
    )
      .map(([key, value]) => ({
        key,
        label: formatIntentLabel(key),
        count: Array.isArray(value) ? value.length : 0,
      }))
      .filter((entry) => entry.count > 0)
  }
  return []
}

type ChatAnalysesResponse = {
  dispute_id: string
  analyses: ChatAnalysisItem[]
  total: number
}

export function ChatAnalysesView({
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
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }
  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>
  }

  const payload = data as ChatAnalysesResponse | null
  const analyses = payload?.analyses ?? []

  if (analyses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No chat analyses available.</p>
    )
  }

  const formatTime = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(iso))
      : '—'

  const statusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          Completed
        </span>
      )
    }
    if (s === 'failed') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
          Failed
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

  const riskBadge = (risk: string | null) => {
    if (!risk) return null
    const r = risk.toLowerCase()
    if (r === 'high') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
          High Risk
        </span>
      )
    }
    if (r === 'medium') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          Medium Risk
        </span>
      )
    }
    if (r === 'low') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          Low Risk
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        {risk}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {analyses.map((a) => (
        <div
          key={a.id}
          className="rounded-lg border border-border bg-background p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {statusBadge(a.status)}
              {riskBadge(a.risk_level)}
              {a.error && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  Error
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              {a.id}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
            <div className="flex justify-between sm:block sm:space-y-1">
              <span>Provider</span>
              <span className="font-medium text-foreground">{a.provider}</span>
            </div>
            <div className="flex justify-between sm:block sm:space-y-1">
              <span>Model</span>
              <span className="font-medium text-foreground">{a.model}</span>
            </div>
            <div className="flex justify-between sm:block sm:space-y-1">
              <span>Messages analyzed</span>
              <span className="font-medium text-foreground">{a.message_count_analyzed}</span>
            </div>
            <div className="flex justify-between sm:block sm:space-y-1">
              <span>Created</span>
              <span className="font-medium text-foreground">{formatTime(a.created_at)}</span>
            </div>
            {a.completed_at && (
              <div className="flex justify-between sm:block sm:space-y-1">
                <span>Completed</span>
                <span className="font-medium text-foreground">{formatTime(a.completed_at)}</span>
              </div>
            )}
          </div>

          {a.summary && (
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Summary
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{a.summary}</p>
            </div>
          )}

          {a.recommendation && (
            <div className="rounded-md bg-purple-50/60 p-3">
              <p className="text-[10px] uppercase tracking-wider text-purple-700 font-semibold mb-1">
                Recommendation
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{a.recommendation}</p>
            </div>
          )}

          {(() => {
            const intents = normalizeDetectedIntents(a.detected_intents)
            if (intents.length === 0) return null
            return (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Detected Intents
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {intents.map((intent) => (
                    <span
                      key={intent.key}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                    >
                      {intent.label}
                      {intent.count > 0 && (
                        <span className="rounded-full bg-slate-200 px-1.5 py-0 text-[10px] font-semibold text-slate-800">
                          {intent.count}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          {Array.isArray(a.flagged_messages) && a.flagged_messages.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                Flagged messages ({a.flagged_messages.length})
              </summary>
              <div className="mt-2 space-y-2">
                {a.flagged_messages.map((fm, idx) => (
                  <div
                    key={`${fm.message_id ?? idx}-${idx}`}
                    className="rounded-md border border-border bg-card p-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      {fm.category && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          {formatIntentLabel(fm.category)}
                        </span>
                      )}
                      {typeof fm.message_index === 'number' && (
                        <span className="text-[10px] text-muted-foreground">
                          Message #{fm.message_index}
                        </span>
                      )}
                    </div>
                    {fm.quote && (
                      <blockquote className="mt-1.5 border-l-2 border-border pl-2 text-xs italic text-foreground">
                        &ldquo;{fm.quote}&rdquo;
                      </blockquote>
                    )}
                    {fm.explanation && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {fm.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {a.error && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">
              <p className="font-semibold mb-0.5">Analysis error</p>
              <p className="whitespace-pre-wrap">{a.error}</p>
            </div>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Total analyses: {payload?.total ?? analyses.length}
      </p>
    </div>
  )
}
