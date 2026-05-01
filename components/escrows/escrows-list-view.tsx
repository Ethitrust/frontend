'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Handshake, PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ClickableEscrowRow } from '@/components/escrows/clickable-escrow-row'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { escrowPartyForViewer } from '@/lib/escrows/escrow-party'
import { fetchAuthMe } from '@/lib/auth/me-session-api'
import { fetchMeEscrows } from '@/lib/escrows/me-escrows-api'
import { escrowListStatusLabel } from '@/lib/escrows/escrow-table-display'
import type { EscrowRow } from '@/lib/escrows/escrow-list-types'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const FILTER_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'pending_funding', label: 'Awaiting funding' },
  { value: 'completed', label: 'Completed' },
]

const PAGE_SIZE = 20

function filterEscrowsOnPage(items: EscrowRow[], status: string) {
  if (!status || status === 'all') return items
  return items.filter((e) => e.status === status)
}

function roleLabelForRow(row: EscrowRow, viewerId: string): string {
  const party = escrowPartyForViewer(row, viewerId)
  if (party === 'initiator') {
    return row.initiator_role === 'buyer' ? 'Buyer (initiator)' : 'Seller (initiator)'
  }
  if (party === 'receiver') {
    return row.initiator_role === 'buyer' ? 'Seller (counterparty)' : 'Buyer (counterparty)'
  }
  return row.initiator_role === 'buyer' ? 'Buyer-related' : 'Counterparty'
}

export function EscrowsListView({ status: statusParam }: { status?: string }) {
  const e = ethitrustThemeTokens
  const accessToken = useAuthStore((s) => s.accessToken)
  const tab = statusParam && FILTER_TABS.some((t) => t.value === statusParam) ? statusParam : 'all'
  const [page, setPage] = useState(1)

  const meQuery = useQuery({
    queryKey: ['me', 'auth', 'me'],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  })

  const listQuery = useQuery({
    queryKey: ['me', 'escrows', 'list', page, PAGE_SIZE],
    queryFn: () => fetchMeEscrows(accessToken!, page, PAGE_SIZE),
    enabled: Boolean(accessToken),
  })

  const viewerId = meQuery.data?.id ?? ''
  const chunk = listQuery.data?.items ?? []
  const rows = useMemo(() => filterEscrowsOnPage(chunk, tab), [chunk, tab])
  const total = listQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1)

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <header className="max-w-xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Transact</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>Escrows</h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>
            Sign in to list escrows you initiate or join. API data comes from GET /escrows on your session.
          </p>
        </header>
        <Card className="mt-10 max-w-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sign in required</CardTitle>
            <CardDescription>Your deal list is scoped to the authenticated user.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full">
              <Link href="/signin">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <header className="max-w-xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Transact</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Escrows
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>
            Secure deals with clear acceptance criteria, inspection windows, and milestone releases.
          </p>
        </header>
        <Button className="shrink-0 rounded-full self-start lg:self-auto" asChild>
          <Link href="/escrows/new">
            <PlusCircle />
            New escrow
          </Link>
        </Button>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load escrows</AlertTitle>
          <AlertDescription>
            {(listQuery.error as Error).message || 'Request failed.'}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {FILTER_TABS.map((t) => {
          const active = tab === t.value
          const href = t.value === 'all' ? '/escrows' : `/escrows?status=${encodeURIComponent(t.value)}`
          return (
            <Link
              key={t.value}
              href={href}
              role="tab"
              aria-selected={active}
              scroll={false}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      <Card className="mt-8 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Handshake className="size-4 text-muted-foreground" aria-hidden />
            Your deals
          </CardTitle>
          <CardDescription>
            {listQuery.isPending ? (
              'Loading…'
            ) : tab === 'all' ? (
              <>
                {chunk.length} escrows on page {page} of {totalPages} · {total} total records
              </>
            ) : (
              <>
                {rows.length} matching “{escrowListStatusLabel(tab)}” on this page ({chunk.length} loaded of{' '}
                {total} total). Other pages may also match.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2 pt-0">
          {listQuery.isPending ? (
            <div className="space-y-3 px-6 py-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No escrows match this filter on this page.{tab !== 'all' ? ' Try “All” or another page.' : null}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-xl text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Your role</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <ClickableEscrowRow
                      key={row.id}
                      row={row}
                      roleLabel={
                        viewerId
                          ? roleLabelForRow(row, viewerId)
                          : meQuery.isPending
                            ? '…'
                            : 'Sign in'
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-4 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page <= 1 || listQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page >= totalPages || listQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
