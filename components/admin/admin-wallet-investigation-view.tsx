'use client'

import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchAdminWalletStuckFunds } from '@/lib/admin/admin-platform-api'
import { formatEscrowMoney } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype
}

type WalletDiag = {
  id: string
  balance?: number | null
  locked_balance?: number | null
  currency?: string | null
  status?: string | null
}

type ParsedStuckFunds = {
  wallet?: WalletDiag
  locks: unknown[]
  transactions: Record<string, unknown>[]
  extraKeys: string[]
}

function numField(v: unknown): number | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return undefined
}

function parseWalletNode(w: unknown): WalletDiag | undefined {
  if (!isPlainObject(w)) return undefined
  const id = typeof w.id === 'string' ? w.id.trim() : ''
  if (!id) return undefined
  return {
    id,
    balance: numField(w.balance),
    locked_balance: numField(w.locked_balance),
    currency: typeof w.currency === 'string' ? w.currency : null,
    status: typeof w.status === 'string' ? w.status : null,
  }
}

function parseTransactionRows(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return []
  const out: Record<string, unknown>[] = []
  for (const row of raw) {
    if (isPlainObject(row)) out.push(row)
  }
  return out
}

function extractLockRows(lockList: unknown[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  for (const entry of lockList) {
    if (isPlainObject(entry)) out.push(entry)
    else out.push({ value: typeof entry === 'object' ? JSON.stringify(entry) : String(entry) })
  }
  return out
}

function parseStuckFundsPayload(data: unknown): ParsedStuckFunds | null {
  if (!isPlainObject(data)) return null
  const known = new Set(['wallet', 'active_locks', 'pending_or_failed_transactions'])
  const extraKeys = Object.keys(data).filter((k) => !known.has(k))

  const wallet = parseWalletNode(data.wallet)

  const locksRaw = Array.isArray(data.active_locks) ? data.active_locks : []
  const locks = locksRaw

  const txRows = parseTransactionRows(data.pending_or_failed_transactions)

  return {
    wallet,
    locks,
    transactions: txRows,
    extraKeys,
  }
}

function sortColumns(rows: Record<string, unknown>[], preferredFirst: string[]) {
  const set = new Set<string>()
  for (const row of rows) Object.keys(row).forEach((k) => set.add(k))
  const rest = [...set].filter((k) => !preferredFirst.includes(k)).sort((a, b) => a.localeCompare(b))
  return [...preferredFirst.filter((k) => set.has(k)), ...rest]
}

function AmountCell({
  amount,
  currency,
}: {
  amount: unknown
  currency?: string | null
}) {
  const cur = currency ?? 'ETB'
  const n = numField(amount)
  if (n === undefined || n === null) return <span className="text-muted-foreground">—</span>
  try {
    return <span className="tabular-nums">{formatEscrowMoney(n, cur)}</span>
  } catch {
    return <span className="tabular-nums">{n}</span>
  }
}

function GenericObjectTable({
  rows,
  emptyLabel,
  currencyHint,
}: {
  rows: Record<string, unknown>[]
  emptyLabel: string
  currencyHint?: string | null
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    )
  }

  const preferredTxn = ['type', 'status', 'amount', 'currency', 'reference', 'id', 'created_at', 'updated_at']
  const preferredLock = ['lock_id', 'id', 'amount', 'reason', 'source_type', 'source_id', 'status', 'currency', 'created_at']
  const sample = rows[0]
  const hasTxnShape = typeof sample.type !== 'undefined' || typeof sample.reference !== 'undefined'
  const preferred = hasTxnShape ? preferredTxn : preferredLock
  const cols = sortColumns(rows, preferred)

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/70">
            {cols.map((c) => (
              <TableHead key={c} className="whitespace-nowrap capitalize">
                {c.replace(/_/g, ' ')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, ri) => {
            const rkRaw =
              typeof row.id === 'string'
                ? row.id
                : typeof row.lock_id === 'string'
                  ? row.lock_id
                  : `idx-${ri}`
            const rk = `${rkRaw}-${ri}`
            return (
              <TableRow key={rk}>
                {cols.map((col) => {
                  const cell = row[col]
                  const rowCur =
                    typeof row.currency === 'string'
                      ? row.currency
                      : typeof row.Currency === 'string'
                        ? row.Currency
                        : currencyHint ?? undefined
                  if (col === 'amount' || col.endsWith('_amount')) {
                    return (
                      <TableCell key={col} className="align-top text-sm">
                        <AmountCell amount={cell} currency={rowCur ?? null} />
                      </TableCell>
                    )
                  }

                  const text =
                    cell === null || cell === undefined
                      ? '—'
                      : typeof cell === 'string'
                        ? cell
                        : typeof cell === 'number' || typeof cell === 'boolean'
                          ? String(cell)
                          : typeof cell === 'object'
                            ? JSON.stringify(cell)
                            : String(cell)

                  const mono =
                    typeof cell === 'string'
                      ? cell.length > 12
                      : typeof cell !== 'boolean' &&
                        typeof cell !== 'number' &&
                        cell !== null &&
                        typeof cell !== 'undefined'

                  return (
                    <TableCell
                      key={col}
                      className={cn('max-w-68 min-w-32 align-top text-sm', mono ? 'wrap-break-word font-mono text-xs' : 'wrap-break-word')}
                      title={typeof text === 'string' ? text : undefined}
                    >
                      {text}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function RawPayloadPeek({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false)
  let dumped = ''
  try {
    dumped = JSON.stringify(value, null, 2)
  } catch {
    dumped = String(value)
  }
  return (
    <div className="border-t border-border pt-6">
      <Button type="button" variant="ghost" size="sm" className="h-9 gap-2 px-2 text-muted-foreground" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        Technical payload (JSON)
      </Button>
      {open ? (
        <pre className="mt-3 max-h-[min(52vh,480px)] overflow-auto rounded-xl border bg-muted/20 p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap wrap-break-word">
          {dumped}
        </pre>
      ) : null}
    </div>
  )
}

function InvestigationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  )
}

export function AdminWalletInvestigationView({
  accessToken,
  walletId,
}: {
  accessToken: string
  walletId: string
}) {
  const e = ethitrustThemeTokens

  const stuckQuery = useQuery({
    queryKey: ['admin', 'wallets', walletId, 'stuck-funds'],
    queryFn: () => fetchAdminWalletStuckFunds(accessToken, walletId),
    enabled: Boolean(accessToken && walletId),
  })

  const data = stuckQuery.data
  const parsed = useMemo(() => (data === undefined ? null : parseStuckFundsPayload(data)), [data])

  const lockRows = useMemo(() => (parsed ? extractLockRows(parsed.locks) : []), [parsed])

  const currencyForTx = parsed?.wallet?.currency ?? 'ETB'

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Wallet investigation
          </h1>
          <p className="mt-2 wrap-break-word font-mono text-xs text-muted-foreground">{walletId}</p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/admin/wallets">Back to wallets</Link>
        </Button>
      </div>

      {stuckQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Investigation unavailable</AlertTitle>
          <AlertDescription>
            {stuckQuery.error instanceof Error ? stuckQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Liquidity outlook</CardTitle>
          <CardDescription>Balances on file, escrow locks, and anything still moving through payouts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          {stuckQuery.isPending ? (
            <InvestigationSkeleton />
          ) : parsed && data !== undefined ? (
            <>
              {parsed.wallet ? (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-foreground">Wallet snapshot</h2>
                  <div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-2">
                    <dl className="grid gap-3">
                      <div>
                        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</dt>
                        <dd className="mt-1">
                          <Badge variant="outline">{parsed.wallet.status ?? 'unknown'}</Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Currency</dt>
                        <dd className="mt-1 text-sm font-semibold">{parsed.wallet.currency ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Identifier</dt>
                        <dd className="mt-1 wrap-break-word font-mono text-[11px] text-muted-foreground">{parsed.wallet.id}</dd>
                      </div>
                    </dl>
                    <dl className="grid gap-3">
                      <div>
                        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Spendable balance</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">
                          <AmountCell amount={parsed.wallet.balance} currency={parsed.wallet.currency ?? null} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Locked balance</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-muted-foreground">
                          <AmountCell amount={parsed.wallet.locked_balance} currency={parsed.wallet.currency ?? null} />
                        </dd>
                      </div>
                      {parsed.wallet.id !== walletId ? (
                        <p className="text-xs text-amber-800 dark:text-amber-400">
                          Returned wallet id differs from the route ({walletId.slice(0, 8)}…); confirm upstream routing before acting.
                        </p>
                      ) : null}
                    </dl>
                  </div>
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Snapshot block was missing—see tables below if the treasury payload still surfaced lock or payout rows.
                </p>
              )}

              {parsed.extraKeys.length > 0 ? (
                <Alert>
                  <AlertTitle>Unexpected fields present</AlertTitle>
                  <AlertDescription className="text-xs">
                    {parsed.extraKeys.join(', ')}
                  </AlertDescription>
                </Alert>
              ) : null}

              <section className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Escrow locks</h2>
                  <span className="text-xs text-muted-foreground">{lockRows.length} active bundle{lockRows.length === 1 ? '' : 's'}</span>
                </div>
                <GenericObjectTable rows={lockRows} emptyLabel="No funds are sitting in active locks." currencyHint={parsed.wallet?.currency ?? null} />
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Pending or failed payouts</h2>
                  <span className="text-xs text-muted-foreground">
                    {parsed.transactions.length} row{parsed.transactions.length === 1 ? '' : 's'}
                  </span>
                </div>
                <GenericObjectTable rows={parsed.transactions} emptyLabel="No pending or failed transactions." currencyHint={currencyForTx} />
              </section>

              <RawPayloadPeek value={data} />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Envelope did not decode as structured JSON—the raw response is below.</p>
              <RawPayloadPeek value={data} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
