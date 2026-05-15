'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ChevronLeft, ChevronRight, Info, Search } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchRiskEvents } from '@/lib/admin/admin-risk-monitoring-api'
import type { RiskEvent } from '@/lib/admin/admin-risk-monitoring-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function formatDt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function AdminRiskEventsView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens

  const [page, setPage] = useState(1)
  const pageSize = 25
  const [userIdFilter, setUserIdFilter] = useState('')

  const eventsQuery = useQuery({
    queryKey: ['admin', 'risk', 'events', page, pageSize, userIdFilter],
    queryFn: () =>
      fetchRiskEvents(accessToken, {
        user_id: userIdFilter || undefined,
        page,
        page_size: pageSize,
      }),
    enabled: Boolean(accessToken),
  })

  const events = eventsQuery.data?.events ?? []
  const total = eventsQuery.data?.total ?? 0
  const canPrev = page > 1
  const canNext = events.length >= pageSize

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header>
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Risk monitoring</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Risk Events Log
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Historical log of risk-related events, behavior flags, and system actions.
        </p>
      </header>

      {/* Filter */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex max-w-md gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="user-id-filter">User ID</Label>
              <Input
                id="user-id-filter"
                placeholder="Search by User UUID..."
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {eventsQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load risk events</AlertTitle>
          <AlertDescription>
            {eventsQuery.error instanceof Error ? eventsQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Events Table */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Events ({total})</CardTitle>
          <CardDescription>Comprehensive history of behavioral risk signals</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No risk events found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>User / Context</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event: RiskEvent) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium text-xs">
                        {event.event_type.replace(/_/g, ' ').toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            U: {event.user_id.slice(0, 8)}
                          </span>
                          {event.escrow_id && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              E: {event.escrow_id.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-semibold uppercase', getSeverityColor(event.severity))}
                        >
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">
                        {event.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={cn('text-xs font-bold', event.risk_score_impact > 0 ? 'text-red-600' : 'text-green-600')}>
                            {event.risk_score_impact > 0 ? '+' : ''}
                            {event.risk_score_impact}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDt(event.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="mr-2 size-4" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
