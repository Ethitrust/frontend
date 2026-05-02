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

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Wallet locks
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Escrow-linked holds on wallet balances — reason, linkage, lifecycle. Open the wallet probe for stuck
          cash diagnostics when needed.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load locks</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Locks</CardTitle>
          <CardDescription>Page {page}.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locks on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lock</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Timeline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminWalletLockRow[]).map((row) => {
                    const amt =
                      row.amount !== undefined && row.amount !== null ? String(row.amount) : '—'
                    return (
                      <TableRow key={row.lock_id}>
                        <TableCell className="font-mono text-[11px] break-all">{row.lock_id}</TableCell>
                        <TableCell className="font-mono text-[11px]">
                          <Link
                            href={`/admin/wallets/${encodeURIComponent(row.wallet_id)}`}
                            className="break-all underline-offset-4 hover:underline"
                          >
                            Wallet
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{amt}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status ?? '—'}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] break-words text-xs">{row.reason ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(row.source_type ?? '—') + ' '}
                          <span className="font-mono">{(row.source_id ?? '').slice(0, 8)}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          <div>Created {dt(row.created_at)}</div>
                          <div>Released {dt(row.released_at)}</div>
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
