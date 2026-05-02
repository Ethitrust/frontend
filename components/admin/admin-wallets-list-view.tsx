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
import type { AdminWalletRow } from '@/lib/admin/admin-api-types'
import { fetchAdminWallets } from '@/lib/admin/admin-platform-api'
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

export function AdminWalletsListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['admin', 'wallets', 'list', page, pageSize],
    queryFn: () => fetchAdminWallets(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const ownerIds = useMemo(() => [...new Set(items.map((row) => row.owner_id).filter(Boolean))], [items])
  const { byId: ownerSummaries, pendingById: ownerPendingById } = useAdminUserSummaries(accessToken, ownerIds)

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Wallets
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Fiat wallet balances owners use with escrows and withdrawals. Investigations surface stuck funds for
          a single wallet id.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load wallets</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Directory</CardTitle>
          <CardDescription>Page {page}.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No wallets on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Balances</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Investigate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminWalletRow[]).map((row) => {
                    const cur = row.currency ?? 'ETB'
                    const avail =
                      row.balance !== undefined && row.balance !== null
                        ? formatEscrowMoney(row.balance, cur)
                        : '—'
                    const locked =
                      row.locked_balance !== undefined && row.locked_balance !== null
                        ? formatEscrowMoney(row.locked_balance, cur)
                        : '—'
                    return (
                      <TableRow key={row.wallet_id}>
                        <TableCell className="font-mono text-[11px] wrap-break-word">{row.wallet_id}</TableCell>
                        <TableCell className="max-w-68 min-w-44 align-top">
                          {ownerPendingById[row.owner_id] ? (
                            <div className="space-y-1.5 pt-1">
                              <Skeleton className="h-4 w-[min(92%,240px)]" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          ) : (
                            <Link
                              href={`/admin/users/${encodeURIComponent(row.owner_id)}`}
                              className="flex flex-col gap-0.5 underline-offset-4 hover:underline"
                            >
                              <span className="text-sm font-medium leading-snug text-foreground">
                                {ownerSummaries[row.owner_id]?.name?.trim() || '—'}
                              </span>
                              {ownerSummaries[row.owner_id]?.email ? (
                                <span className="text-xs leading-snug text-muted-foreground wrap-break-word">
                                  {ownerSummaries[row.owner_id]?.email}
                                </span>
                              ) : null}
                              <span className="wrap-break-word font-mono text-[10px] leading-tight tracking-tight text-muted-foreground">
                                {row.owner_id}
                              </span>
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>{row.currency ?? '—'}</TableCell>
                        <TableCell className="text-xs">
                          <div>Avail {avail}</div>
                          <div className="text-muted-foreground">Lock {locked}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status ?? '—'}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{dt(row.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="rounded-full" asChild>
                            <Link href={`/admin/wallets/${encodeURIComponent(row.wallet_id)}`}>
                              View
                            </Link>
                          </Button>
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
