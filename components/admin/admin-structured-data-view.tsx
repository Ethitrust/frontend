'use client'

import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminUserSummaries } from '@/hooks/admin/use-admin-user-summaries'
import type { AdminUserRow } from '@/lib/admin/admin-api-types'
import { cn } from '@/lib/utils'

const ADMIN_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function shortId(id: string) {
  if (id.length <= 14) return id
  return `${id.slice(0, 10)}…`
}

function prettifyLabel(key: string) {
  const k = key.trim()
  if (!k || k === '/') return 'Value'
  return k.replace(/_/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1))
}

const USER_LOOKUP_KEYS = new Set(
  (
    [
      'user_id',
      'initiator_id',
      'receiver_id',
      'sender_id',
      'owner_id',
      'actor_id',
      'participant_id',
      'moderator_user_id',
      'mediator_user_id',
      'assigned_mediator_id',
      'moderated_by',
      'applicant_user_id',
      'from_user_id',
      'to_user_id',
      'created_by',
      'reviewed_by',
      'released_by',
      'cancelled_by',
      'released_by_operator',
      'cancelled_by_operator',
    ] as const
  ).map((x) => x.toLowerCase()),
)

export function isUserLookupFieldKey(key: string): boolean {
  const k = key.trim().toLowerCase()
  if (!k) return false
  if (USER_LOOKUP_KEYS.has(k)) return true
  return /_user_id$/i.test(k)
}

export function collectUserLookupIds(value: unknown, maxUnique = 48): string[] {
  const seen = new Set<string>()
  const walk = (node: unknown) => {
    if (seen.size >= maxUnique) return
    if (node !== null && typeof node === 'object') {
      if (Array.isArray(node)) {
        for (const el of node) walk(el)
        return
      }
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (seen.size >= maxUnique) break
        if (typeof v === 'string') {
          const t = v.trim()
          if (isUserLookupFieldKey(k) && ADMIN_UUID_RE.test(t)) seen.add(t)
          continue
        }
        walk(v)
      }
    }
  }
  walk(value)
  return [...seen]
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype
}

function tableCandidate(rows: unknown[]): rows is Record<string, unknown>[] {
  if (!rows.length || rows.length > 72) return false
  let ok = 0
  for (const r of rows) {
    if (!isPlainRecord(r)) return false
    ok += 1
  }
  return ok === rows.length
}

export function AdminUserSummaryCard({
  userId,
  user,
  isLoading,
}: {
  userId: string
  user?: AdminUserRow | null
  isLoading?: boolean
}) {
  const enc = encodeURIComponent(userId)
  if (isLoading) {
    return (
      <div className="flex max-w-xs flex-col gap-2 rounded-lg border bg-muted/40 p-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-2.5 w-56" />
      </div>
    )
  }

  if (!user) {
    return (
      <Link
        href={`/admin/users/${enc}`}
        className="flex max-w-xs flex-col gap-0.5 rounded-lg border bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50"
      >
        <span className="text-xs font-medium text-foreground">User</span>
        <span className="truncate font-mono text-[11px] text-muted-foreground" title={userId}>
          {userId}
        </span>
        <span className="text-[10px] leading-snug text-muted-foreground">
          Open profile · no directory row matched this identifier
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={`/admin/users/${enc}`}
      className={cn(
        'flex max-w-xs flex-col gap-0.5 rounded-lg border border-border bg-card p-3 text-left shadow-sm',
        'transition-colors hover:border-primary/35 hover:bg-muted/25',
      )}
    >
      <span className="text-sm font-semibold leading-snug text-foreground">
        {user.name?.trim() || 'No display name'}
      </span>
      <span className="truncate text-xs text-muted-foreground" title={user.email}>
        {user.email || 'No email'}
      </span>
      <span className="wrap-break-word mt-1 font-mono text-[10px] leading-tight tracking-tight text-muted-foreground">
        {user.user_id}
      </span>
    </Link>
  )
}

type WalkCtx = {
  userLookup: Record<string, AdminUserRow | null | undefined>
  lookupsPending: boolean
  depthMax: number
}

function resolvedUserSnippet(
  userId: string,
  ctx: Pick<WalkCtx, 'userLookup' | 'lookupsPending'>,
): ReactNode {
  const u = ctx.userLookup[userId]
  if (u === undefined && ctx.lookupsPending) {
    return <Skeleton className="h-14 w-[min(20rem,100%)] rounded-md" />
  }
  if (u) {
    return (
      <div className="inline-flex min-w-0 max-w-xl flex-col gap-0.5 rounded-md border border-border/70 bg-muted/15 px-2 py-1.5">
        <span className="text-sm font-semibold leading-snug">{u.name?.trim() || '—'}</span>
        <span className="truncate text-xs text-muted-foreground" title={u.email}>
          {u.email || 'No email'}
        </span>
        <Link href={`/admin/users/${encodeURIComponent(userId)}`} className="font-mono text-[10px] text-muted-foreground hover:underline">
          {userId}
        </Link>
      </div>
    )
  }
  const enc = encodeURIComponent(userId)
  return (
    <Link href={`/admin/users/${enc}`} className="inline-flex items-center rounded-full border bg-muted/25 px-2 py-0.5 font-mono text-[11px] text-primary hover:bg-muted/50">
      {shortId(userId)}
    </Link>
  )
}

function scalarNode(value: unknown, fieldKey: string, depth: number, ctx: WalkCtx): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'secondary' : 'outline'} className="rounded-full px-2 py-px text-[10px]">
        {value ? 'yes' : 'no'}
      </Badge>
    )
  }

  if (typeof value === 'number') {
    return (
      <span className={cn(depth > 0 ? 'tabular-nums text-sm' : 'tabular-nums')}>
        {Number.isFinite(value) ? String(value) : JSON.stringify(value)}
      </span>
    )
  }

  if (typeof value !== 'string') {
    return <span className="wrap-break-word font-mono text-xs">{String(value)}</span>
  }

  const trimmed = value.trim()
  const looksUuid = ADMIN_UUID_RE.test(trimmed)

  if (looksUuid && isUserLookupFieldKey(fieldKey)) {
    return resolvedUserSnippet(trimmed, ctx)
  }

  if (looksUuid) {
    const enc = encodeURIComponent(trimmed)

    let href: string | null = null
    const fk = fieldKey.toLowerCase()
    if (/(^|_)escrow_?id$|^escrow$/i.test(fieldKey) || fk === 'escrow_id' || fk === 'escrow') {
      href = `/admin/escrows/${enc}`
    } else if (
      fk === 'wallet_id' ||
      fk.endsWith('_wallet_id') ||
      /^wallet$/i.test(fieldKey)
    ) {
      href = `/admin/wallets/${enc}`
    } else if (fk === 'dispute_id' || fk.endsWith('_dispute_id') || /^dispute$/i.test(fieldKey)) {
      href = `/admin/disputes/${enc}`
    } else if (fk === 'fee_id' || fk.endsWith('_fee_id')) {
      href = '/admin/fees'
    }

    const chip = (
      <span className="rounded-md bg-muted/35 px-1.5 py-0.5 font-mono text-[11px] text-foreground tabular-nums" title={trimmed}>
        {shortId(trimmed)}
      </span>
    )

    if (href) {
      return (
        <Link href={href} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
          {chip}
          <span className="sr-only">Open linked admin record</span>
        </Link>
      )
    }

    return chip
  }

  if (trimmed.length > 360) {
    return (
      <p className="wrap-break-word whitespace-pre-wrap text-sm leading-relaxed text-foreground">{`${trimmed.slice(0, 360)}…`}</p>
    )
  }
  return <span className="wrap-break-word whitespace-pre-wrap text-sm text-foreground">{trimmed}</span>
}

function structuredWalk(value: unknown, fieldKey: string, depth: number, ctx: WalkCtx): ReactNode {
  const nextDepth = depth + 1

  if (depth >= ctx.depthMax) {
    try {
      return (
        <pre className="max-h-40 overflow-auto rounded-md bg-muted/30 p-2 font-mono text-[10px] leading-snug whitespace-pre-wrap wrap-break-word">
          {typeof value === 'string' ? value : JSON.stringify(value)}
        </pre>
      )
    } catch {
      return <span className="text-muted-foreground">deep value</span>
    }
  }

  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return scalarNode(value, fieldKey, depth, ctx)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-sm text-muted-foreground">Nothing here yet.</span>
    }

    if (tableCandidate(value)) {
      const keySet = new Set<string>()
      for (const row of value) {
        for (const k of Object.keys(row)) keySet.add(k)
      }

      const userishFirst = (a: string, b: string) => {
        const au = Number(isUserLookupFieldKey(a))
        const bu = Number(isUserLookupFieldKey(b))
        if (au !== bu) return bu - au
        return a.localeCompare(b)
      }
      const columns = [...keySet].sort(userishFirst)

      return (
        <div className="max-h-[min(70vh,520px)] w-full overflow-auto rounded-lg border border-border/70 bg-muted/25">
          <div className="min-w-max p-1">
            <Table className="text-xs">
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <TableRow>
                  <TableHead className="bg-muted font-mono text-[10px]">#</TableHead>
                  {columns.map((c) => (
                    <TableHead key={c} className="max-w-88 min-w-28 bg-muted whitespace-normal font-semibold capitalize">
                      {prettifyLabel(c)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {value.map((row, i) => (
                  <TableRow key={`tb-${depth}-${i}`}>
                    <TableCell className="align-top font-mono text-muted-foreground">{i + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={`${i}:${col}`} className="align-top">
                        <div className="max-w-xl py-1">
                          {structuredWalk(row[col], col, nextDepth, ctx)}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )
    }

    return (
      <ul className="space-y-2">
        {value.map((entry, idx) => (
          // eslint-disable-next-line react/no-array-index-key -- API arrays lack stable identifiers
          <li key={`arr-${depth}-${idx}`} className="rounded-lg border border-dashed bg-muted/10 px-3 py-2">
            {structuredWalk(entry, '/', nextDepth, ctx)}
          </li>
        ))}
      </ul>
    )
  }

  if (isPlainRecord(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return <span className="text-sm text-muted-foreground">Empty object.</span>
    }

    const priority = ['title', 'name', 'status', 'currency', 'amount', 'escrow_type', 'created_at', 'updated_at']
    entries.sort(([a], [b]) => {
      const ia = priority.indexOf(a)
      const ib = priority.indexOf(b)
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
      const ak = Number(isUserLookupFieldKey(a))
      const bk = Number(isUserLookupFieldKey(b))
      if (ak !== bk) return bk - ak
      return a.localeCompare(b)
    })

    return (
      <div className="divide-y divide-border rounded-lg border border-border/70 bg-muted/15">
        {entries.map(([k, nodeVal]) => (
          <div key={k} className={cn('grid gap-2 px-3 py-3', depth <= 2 ? 'md:grid-cols-[minmax(8rem,12rem)_1fr]' : 'sm:grid-cols-[minmax(6rem,10rem)_1fr]')}>
            <dt className="wrap-break-word text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {prettifyLabel(k)}
            </dt>
            <dd className="min-w-0">{structuredWalk(nodeVal, k, nextDepth, ctx)}</dd>
          </div>
        ))}
      </div>
    )
  }

  try {
    return (
      <pre className="max-h-52 overflow-auto rounded-md bg-muted/30 p-2 font-mono text-[11px] leading-snug whitespace-pre-wrap wrap-break-word">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  } catch {
    return <span className="wrap-break-word font-mono text-xs">{String(value)}</span>
  }
}

function RawPayloadPeek({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false)
  try {
    const dumped =
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value, null, 2)
    return (
      <div className="mt-6 border-t border-border pt-4">
        <Button type="button" variant="ghost" size="sm" className="h-9 gap-2 px-2 text-muted-foreground" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          Raw payload ({typeof value})
        </Button>
        {open ? (
          <pre className="mt-2 max-h-[min(40vh,320px)] overflow-auto rounded-lg border bg-muted/20 p-3 font-mono text-[11px] leading-snug whitespace-pre-wrap wrap-break-word">
            {dumped}
          </pre>
        ) : null}
      </div>
    )
  } catch {
    return null
  }
}

/** Operator-friendly rendering of escrow console drill payloads plus resolved user summaries. */

export function AdminStructuredDataView({
  accessToken,
  data,
  isPending,
  errorMessage,
}: {
  accessToken: string
  data: unknown
  isPending?: boolean
  errorMessage?: string | null
}) {
  const ids = useMemo(() => collectUserLookupIds(data), [data])

  const { byId: userLookup, pending: lookupsPending } = useAdminUserSummaries(accessToken, ids)

  const ctx = useMemo<WalkCtx>(() => ({
    userLookup,
    lookupsPending,
    depthMax: 12,
  }), [lookupsPending, userLookup])

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-6 w-2/5" />
      </div>
    )
  }

  if (errorMessage) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load this section</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  if (data === null || typeof data === 'undefined') {
    return <p className="text-sm text-muted-foreground">No payload returned for this escrow.</p>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-linear-to-br from-muted/35 via-transparent to-muted/25 p-px shadow-sm dark:from-muted/20">
        <div className="rounded-[13px] bg-card px-4 py-5">{structuredWalk(data, '/', 0, ctx)}</div>
      </div>
      <RawPayloadPeek value={data} />
    </div>
  )
}
