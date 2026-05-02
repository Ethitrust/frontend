'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import type { AdminTransactionRow } from '@/lib/admin/admin-api-types'
import { fetchAdminTransactions, resolveAdminWalletOwnerIds } from '@/lib/admin/admin-platform-api'
import { formatEscrowDateTime, formatEscrowMoney } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAdminUserSummaries } from '@/hooks/admin/use-admin-user-summaries'

function dt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

export function AdminTransactionsListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['admin', 'transactions', 'list', page, pageSize],
    queryFn: () => fetchAdminTransactions(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const walletIdsSorted = useMemo(() => {
    const s = new Set<string>()
    for (const row of items as AdminTransactionRow[]) {
      const w = typeof row.wallet_id === 'string' ? row.wallet_id.trim() : ''
      const hasDirect =
        !!(typeof row.owner_id === 'string' && row.owner_id.trim()) ||
        !!(typeof row.user_id === 'string' && row.user_id.trim())
      if (w && !hasDirect) s.add(w)
    }
    return [...s].sort()
  }, [items])

  const ownerMapQuery = useQuery({
    queryKey: ['admin', 'transactions', 'wallet-owner-map', walletIdsSorted.join('|')],
    queryFn: () => resolveAdminWalletOwnerIds(accessToken, walletIdsSorted, { pageSize: 100, maxPages: 30 }),
    enabled: Boolean(accessToken && listQuery.isSuccess && walletIdsSorted.length > 0),
    staleTime: 30_000,
  })

  const ownerIdsForDirectory = useMemo(() => {
    const map = ownerMapQuery.data ?? {}
    const out = new Set<string>()
    for (const row of items as AdminTransactionRow[]) {
      const o = typeof row.owner_id === 'string' ? row.owner_id.trim() : ''
      const u = typeof row.user_id === 'string' ? row.user_id.trim() : ''
      if (o) {
        out.add(o)
        continue
      }
      if (u) {
        out.add(u)
        continue
      }
      const wid = typeof row.wallet_id === 'string' ? row.wallet_id.trim() : ''
      if (wid && map[wid]) out.add(map[wid])
    }
    return [...out]
  }, [items, ownerMapQuery.data])

  const { byId: userById, pendingById: userPendingById } = useAdminUserSummaries(accessToken, ownerIdsForDirectory)

  const ownerIdForRow = (row: AdminTransactionRow): string | undefined => {
    const direct =
      (typeof row.owner_id === 'string' ? row.owner_id.trim() : '') ||
      (typeof row.user_id === 'string' ? row.user_id.trim() : '')
    if (direct) return direct
    const wid = typeof row.wallet_id === 'string' ? row.wallet_id.trim() : ''
    if (wid && ownerMapQuery.data?.[wid]) return ownerMapQuery.data[wid]
    return undefined
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl space-y-3">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
        <h1 className={cn(e.typography.displayLG, 'font-serif font-normal text-foreground')}>Transactions</h1>
        <p className={cn(e.typography.bodyMuted)}>
          Ledger of money-movement rows across wallets and escrows. For failure-only diagnostics use the{' '}
          <Link href="/admin/transactions/failures" className="underline-offset-4 hover:underline">
            failures viewer
          </Link>
          .
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load transactions</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ledger</CardTitle>
          <CardDescription>Page {page}.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rows on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Escrow</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminTransactionRow[]).map((row) => {
                    const cur = row.currency ?? 'ETB'
                    const amt =
                      row.amount !== undefined && row.amount !== null
                        ? formatEscrowMoney(row.amount, cur)
                        : '—'
                    const wid = typeof row.wallet_id === 'string' ? row.wallet_id.trim() : ''
                    const hasDirectUser =
                      !!(typeof row.owner_id === 'string' && row.owner_id.trim()) ||
                      !!(typeof row.user_id === 'string' && row.user_id.trim())
                    const awaitingWalletOwnerMap = Boolean(wid && !hasDirectUser && ownerMapQuery.isPending)
                    const ownerUid = ownerIdForRow(row)
                    const userRow = ownerUid ? userById[ownerUid] : undefined
                    const userCellLoading =
                      awaitingWalletOwnerMap || Boolean(ownerUid && userPendingById[ownerUid])

                    return (
                      <TableRow key={row.transaction_id}>
                        <TableCell className="wrap-break-word font-mono text-[11px]">{row.transaction_id}</TableCell>
                        <TableCell className="max-w-68 min-w-36 align-top">
                          {userCellLoading ? (
                            <div className="space-y-1.5 pt-0.5">
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="h-3 w-36" />
                            </div>
                          ) : !ownerUid ? (
                            <span className="text-sm text-muted-foreground">—</span>
                          ) : (
                            <Link
                              href={`/admin/users/${encodeURIComponent(ownerUid)}`}
                              className="group flex flex-col gap-0.5 underline-offset-4 hover:underline"
                            >
                              <span className="text-sm font-medium leading-snug text-foreground">
                                {userRow?.name?.trim() || '—'}
                              </span>
                              {userRow?.email ? (
                                <span className="truncate text-xs text-muted-foreground group-hover:text-foreground">
                                  {userRow.email}
                                </span>
                              ) : null}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{row.transaction_type ?? '—'}</TableCell>
                        <TableCell className="text-sm">{amt}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status ?? '—'}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[11px]">
                          {row.wallet_id ? (
                            <Link
                              href={`/admin/wallets/${encodeURIComponent(row.wallet_id)}`}
                              className="wrap-break-word underline-offset-4 hover:underline"
                            >
                              Wallet
                            </Link>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-[11px]">
                          {row.escrow_id ? (
                            <Link
                              href={`/admin/escrows/${encodeURIComponent(row.escrow_id)}`}
                              className="wrap-break-word underline-offset-4 hover:underline"
                            >
                              Escrow
                            </Link>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {dt(row.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between gap-4 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous page
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next page
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
