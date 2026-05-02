'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { AdminJsonInspect } from '@/components/admin/admin-json-inspect'
import { fetchAdminTransactionsFailures } from '@/lib/admin/admin-platform-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function isPlainObjectRows(data: unknown): data is Record<string, unknown>[] {
  return Array.isArray(data) && data.length > 0 && data.every((x) => x !== null && typeof x === 'object' && !Array.isArray(x))
}

export function AdminTransactionsFailuresView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens

  const failuresQuery = useQuery({
    queryKey: ['admin', 'transactions', 'failures'],
    queryFn: () => fetchAdminTransactionsFailures(accessToken),
    enabled: Boolean(accessToken),
  })

  const data = failuresQuery.data
  const tableRows = data !== undefined && isPlainObjectRows(data) ? data : null
  const cols =
    tableRows && tableRows.length > 0
      ? Array.from(new Set(tableRows.flatMap((r) => Object.keys(r)))).slice(0, 12)
      : []

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl space-y-3">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Platform</p>
        <h1 className={cn(e.typography.displayLG, 'font-serif font-normal text-foreground')}>
          Failed movements
        </h1>
        <p className={cn(e.typography.bodyMuted)}>
          Operator snapshot of stalled or failed payouts and settlements (shape depends on upstream export).{' '}
          <Link href="/admin/transactions" className="underline-offset-4 hover:underline">
            Back to full ledger
          </Link>
          .
        </p>
      </header>

      {failuresQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load failures</AlertTitle>
          <AlertDescription>
            {failuresQuery.error instanceof Error ? failuresQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Failures payload</CardTitle>
          <CardDescription>
            When the reply is an array of objects we render a skinny table; otherwise you get structured text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failuresQuery.isPending ? (
            <Skeleton className="h-56 w-full" />
          ) : tableRows && cols.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {cols.map((c) => (
                      <TableHead key={c} className="text-xs capitalize">
                        {c.replace(/_/g, ' ')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((r, idx) => (
                    <TableRow key={idx}>
                      {cols.map((c) => (
                        <TableCell key={c} className="max-w-[200px] break-all font-mono text-[11px]">
                          {serializeCell(r[c])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <AdminJsonInspect
              data={data}
              errorMessage={
                failuresQuery.isError ? (failuresQuery.error as Error)?.message : null
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function serializeCell(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}
