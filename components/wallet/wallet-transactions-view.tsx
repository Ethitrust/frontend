'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { WalletFlowShell } from '@/components/wallet/wallet-flow-shell'
import { WalletPaymentsGate } from '@/components/wallet/wallet-payments-gate'
import { formatEscrowDateTime, formatEscrowMoney } from '@/lib/escrows/format-escrow'
import {
  fetchMeWalletList,
  fetchMeWalletTransactions,
  pickDefaultWalletId,
} from '@/lib/wallets/me-wallet-api'
import type { WalletRow } from '@/lib/wallets/wallet-types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

function transactionLabel(type: string) {
  const t = type.replace(/_/g, ' ')
  return t.length > 0 ? t.charAt(0).toUpperCase() + t.slice(1) : type
}

function txnStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status.toLowerCase()
  if (s === 'completed' || s === 'success' || s === 'successful') return 'secondary'
  if (s === 'failed' || s === 'rejected' || s === 'cancelled') return 'destructive'
  if (s === 'pending') return 'outline'
  return 'default'
}

export function WalletTransactionsView() {
  return (
    <WalletPaymentsGate
      title="Transaction history"
      description="Review deposits, withdrawals, escrow movements, and other entries. Switch wallets if you use more than one currency."
    >
      {(accessToken) => <WalletTransactionsSignedIn accessToken={accessToken} />}
    </WalletPaymentsGate>
  )
}

function WalletTransactionsSignedIn({ accessToken }: { accessToken: string }) {
  const [walletId, setWalletId] = useState('')
  const [page, setPage] = useState(1)

  const walletsQuery = useQuery({
    queryKey: ['me', 'wallets'],
    queryFn: () => fetchMeWalletList(accessToken),
    enabled: Boolean(accessToken),
  })

  useEffect(() => {
    const list = walletsQuery.data
    if (!list?.length || walletId) return
    const id = pickDefaultWalletId(list)
    if (id) setWalletId(id)
  }, [walletsQuery.data, walletId])

  useEffect(() => {
    setPage(1)
  }, [walletId])

  const txsQuery = useQuery({
    queryKey: ['me', 'wallets', walletId, 'transactions', page, PAGE_SIZE],
    queryFn: () => fetchMeWalletTransactions(accessToken, walletId, page, PAGE_SIZE),
    enabled: Boolean(accessToken && walletId),
    placeholderData: (prev) => prev,
  })

  const totalPages = txsQuery.data
    ? Math.max(1, Math.ceil(txsQuery.data.total / Math.max(txsQuery.data.page_size, 1)))
    : 1
  const spanStart =
    txsQuery.data && txsQuery.data.total > 0
      ? (txsQuery.data.page - 1) * txsQuery.data.page_size + 1
      : 0
  const spanEnd = txsQuery.data
    ? Math.min(txsQuery.data.page * txsQuery.data.page_size, txsQuery.data.total)
    : 0

  return (
    <WalletFlowShell
      title="Transaction history"
      description="Financial movements linked to one of your wallets. Filter by wallet when you hold balances in multiple currencies."
      contentClassName="max-w-6xl"
    >
      {!walletsQuery.data && walletsQuery.isPending ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : walletsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load wallets</AlertTitle>
          <AlertDescription>
            {walletsQuery.error instanceof Error ? walletsQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : !walletsQuery.data?.length ? (
        <Alert>
          <AlertTitle>No wallets</AlertTitle>
          <AlertDescription>There are no wallets to show history for.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {walletsQuery.data.length > 1 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="tx-wallet-select">
                  Wallet
                </label>
                <Select value={walletId} onValueChange={setWalletId}>
                  <SelectTrigger id="tx-wallet-select" className="w-full rounded-lg sm:w-72">
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {(walletsQuery.data as WalletRow[]).map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.currency} — {w.id.slice(0, 8)}…
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="rounded-full sm:mb-[2px]" asChild>
                <Link href="/wallet">Overview</Link>
              </Button>
            </div>
          ) : null}

          {!walletId ? null : txsQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not load transactions</AlertTitle>
              <AlertDescription>
                {txsQuery.error instanceof Error ? txsQuery.error.message : 'Request failed'}
              </AlertDescription>
            </Alert>
          ) : txsQuery.isPending && !txsQuery.data?.items?.length ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[8rem]">When</TableHead>
                      <TableHead className="min-w-[9rem]">Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                      <TableHead className="min-w-[7rem]">Status</TableHead>
                      <TableHead className="min-w-[5rem]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(txsQuery.data?.items ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="align-top text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                          {formatEscrowDateTime(row.created_at)}
                        </TableCell>
                        <TableCell className="align-top text-sm">{transactionLabel(row.type)}</TableCell>
                        <TableCell className="max-w-[18rem] align-top">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {row.description || row.reference || '—'}
                          </p>
                          {row.provider ? (
                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                              provider {row.provider}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell
                          className={cnAmt(row.amount)}
                        >
                          {row.amount >= 0 ? '+' : ''}
                          {formatEscrowMoney(row.amount, row.currency)}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant={txnStatusVariant(row.status)} className="font-normal capitalize">
                            {row.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          {row.escrow_id ? (
                            <Link
                              className="text-xs text-primary underline-offset-4 hover:underline whitespace-nowrap"
                              href={`/escrows/${row.escrow_id}`}
                            >
                              Escrow
                            </Link>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {txsQuery.data && txsQuery.data.total === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions for this wallet yet.</p>
              ) : txsQuery.data ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-sm">
                  <p className="text-muted-foreground">
                    {txsQuery.data.total > 0
                      ? `Showing ${spanStart}–${spanEnd} of ${txsQuery.data.total}`
                      : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={page <= 1 || txsQuery.isPending}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="min-w-[4.5rem] text-center text-xs tabular-nums">
                      Page {txsQuery.data.page} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={page >= totalPages || txsQuery.isPending}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </WalletFlowShell>
  )
}

function cnAmt(amount: number) {
  return cn(
    'text-right align-top text-sm tabular-nums font-medium whitespace-nowrap',
    amount >= 0 && 'text-emerald-700 dark:text-emerald-400',
  )
}
