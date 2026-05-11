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
import type { AdminKycSubmissionRow } from '@/lib/admin/admin-api-types'
import { fetchAdminKycSubmissions } from '@/lib/admin/admin-people-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function formatDt(iso?: string | null) {
  if (!iso) {
    return '—'
  }
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

const STATUS_FILTER_ALL = '__all__'

export function ModeratorKycSubmissionsListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL)
  const pageSize = 20

  const listQuery = useQuery({
    queryKey: ['moderator', 'kyc', 'submissions', page, pageSize, statusFilter],
    queryFn: () =>
      fetchAdminKycSubmissions(
        accessToken,
        page,
        pageSize,
        statusFilter === STATUS_FILTER_ALL ? null : statusFilter,
      ),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Verification</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Manual KYC
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Document-forward verification packets. Filter by status and open a submission to render images and
          record a decision.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load submissions</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Submissions</CardTitle>
            <CardDescription>Page {page}.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger size="sm" className="w-[200px] cursor-pointer">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submission</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminKycSubmissionRow[]).map((row) => (
                    <TableRow key={row.submission_id}>
                      <TableCell className="align-top">
                        <div className="font-mono text-[11px] text-muted-foreground break-all">
                          {row.submission_id}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {row.id_type ?? '—'} · {row.id_number ?? '—'}
                        </div>
                      </TableCell>
                      <TableCell className="align-top font-mono text-[11px] text-muted-foreground break-all">
                        {row.user_id}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant={row.status === 'approved' ? 'default' : 'outline'}>
                          {row.status ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap text-xs text-muted-foreground">
                        {formatDt(row.submitted_at)}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <Button size="sm" variant="outline" className="rounded-full" asChild>
                          <Link
                            href={`/moderator/kyc/submissions/${encodeURIComponent(row.submission_id)}`}
                          >
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
