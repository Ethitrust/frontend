'use client'

import Link from 'next/link'
import { useState } from 'react'
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
import type { AdminWalletLockRow } from '@/lib/admin/admin-api-types'
import { fetchAdminWalletLocks } from '@/lib/admin/admin-platform-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function dt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

export function AdminWalletLocksListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['admin', 'wallet-locks', 'list', page, pageSize],
    queryFn: () => fetchAdminWalletLocks(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const stats = {
    active: items.filter(i => i.status === 'active' || i.status === 'locked').length,
    totalAmount: items.reduce((acc, i) => acc + (i.amount || 0), 0),
    released: items.filter(i => i.status === 'released').length
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header>
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform financial controls</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Wallet Locks
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Manage escrow-linked holds and security freezes on platform balances.
        </p>
      </header>

      {/* Stats Bar */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm border-primary/10 bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active holds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{listQuery.isPending ? '...' : stats.active}</div>
            <p className="mt-1 text-xs text-muted-foreground">Currently restricted balances</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Value Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{listQuery.isPending ? '...' : stats.totalAmount.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">ETB</span></div>
            <p className="mt-1 text-xs text-muted-foreground">Aggregate of all active locks</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recently Released</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{listQuery.isPending ? '...' : stats.released}</div>
            <p className="mt-1 text-xs text-muted-foreground">Locks cleared in current view</p>
          </CardContent>
        </Card>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load locks</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ledger history</CardTitle>
          <CardDescription>Detailed record of hold events and linkages.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No wallet locks found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lock ID</TableHead>
                    <TableHead>Target Wallet</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason / Context</TableHead>
                    <TableHead>Timeline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminWalletLockRow[]).map((row) => {
                    const amt = row.amount !== undefined && row.amount !== null ? row.amount.toLocaleString() : '—'
                    return (
                      <TableRow key={row.lock_id}>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{row.lock_id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/wallets/${encodeURIComponent(row.wallet_id)}`}
                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {row.wallet_id.slice(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell className="font-semibold">{amt} ETB</TableCell>
                        <TableCell>
                          <Badge 
                            variant={row.status === 'active' || row.status === 'locked' ? 'destructive' : 'secondary'}
                            className="text-[10px] uppercase font-bold"
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[240px]">
                            <p className="text-xs font-medium line-clamp-1">{row.reason || 'No reason provided'}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              Source: {row.source_type} ({row.source_id?.slice(0, 8)})
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground leading-relaxed">
                          <div><span className="opacity-60">Locked:</span> {dt(row.created_at)}</div>
                          {row.released_at && <div><span className="opacity-60">Lifted:</span> {dt(row.released_at)}</div>}
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
