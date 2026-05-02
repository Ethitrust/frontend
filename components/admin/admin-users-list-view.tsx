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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { AdminUsersListFilters } from '@/lib/admin/admin-people-api'
import { fetchAdminUsers } from '@/lib/admin/admin-people-api'
import type { AdminUserRow } from '@/lib/admin/admin-api-types'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

const ANY = '__any__' as const

type RoleFilter = typeof ANY | 'admin' | 'user'

type KycStatusFilter = typeof ANY | 'verified' | 'unverified' | 'pending' | 'rejected'

type ToolbarState = {
  search: string
  role: RoleFilter
  kyc_status: KycStatusFilter
  banned: typeof ANY | 'yes' | 'no'
  emailVerified: typeof ANY | 'yes' | 'no'
}

function defaultToolbar(): ToolbarState {
  return {
    search: '',
    role: ANY,
    kyc_status: ANY,
    banned: ANY,
    emailVerified: ANY,
  }
}

function toolbarToApiFilters(state: ToolbarState): AdminUsersListFilters {
  const f: AdminUsersListFilters = {}
  const search = state.search.trim()
  if (search) {
    f.search = search
  }
  if (state.role !== ANY) {
    f.role = state.role
  }
  if (state.kyc_status !== ANY) {
    f.kyc_status = state.kyc_status
  }
  if (state.banned === 'yes') {
    f.banned = true
  }
  if (state.banned === 'no') {
    f.banned = false
  }
  if (state.emailVerified === 'yes') {
    f.email_verified = true
  }
  if (state.emailVerified === 'no') {
    f.email_verified = false
  }
  return f
}

function hasActiveFilters(state: ToolbarState): boolean {
  return (
    Boolean(state.search.trim()) ||
    state.role !== ANY ||
    state.kyc_status !== ANY ||
    state.banned !== ANY ||
    state.emailVerified !== ANY
  )
}

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

export function AdminUsersListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [draft, setDraft] = useState<ToolbarState>(() => defaultToolbar())
  const [applied, setApplied] = useState<ToolbarState>(() => defaultToolbar())

  const apiFilters = toolbarToApiFilters(applied)

  const listQuery = useQuery({
    queryKey: [
      'admin',
      'users',
      'list',
      page,
      pageSize,
      applied.search,
      applied.role,
      applied.kyc_status,
      applied.banned,
      applied.emailVerified,
    ],
    queryFn: () => fetchAdminUsers(accessToken, page, pageSize, apiFilters),
    enabled: Boolean(accessToken),
  })

  function applyDraft() {
    setApplied({ ...draft })
    setPage(1)
  }

  function clearAll() {
    const z = defaultToolbar()
    setDraft(z)
    setApplied(z)
    setPage(1)
  }

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>People & verification</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Users
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Platform directory of registered accounts. Open a workspace to review context, moderation controls,
          and KYC shortcuts.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load users</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader className="space-y-6">
          <div>
            <CardTitle className="text-base font-semibold">Directory</CardTitle>
            <CardDescription>
              Page {page}. Narrow rows with filters, then refine with search. Matches depend on API support
              for each field.
            </CardDescription>
          </div>

          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault()
              applyDraft()
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2 sm:col-span-2 xl:col-span-2">
                <Label htmlFor="admin-users-search">Search</Label>
                <Input
                  id="admin-users-search"
                  name="search"
                  value={draft.search}
                  onChange={(ev) => setDraft((d) => ({ ...d, search: ev.target.value }))}
                  placeholder="Name, email, or user id"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={draft.role}
                  onValueChange={(v: RoleFilter) => setDraft((d) => ({ ...d, role: v }))}
                >
                  <SelectTrigger id="admin-users-role" className="cursor-pointer">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>KYC status</Label>
                <Select
                  value={draft.kyc_status}
                  onValueChange={(v: KycStatusFilter) => setDraft((d) => ({ ...d, kyc_status: v }))}
                >
                  <SelectTrigger id="admin-users-kyc" className="cursor-pointer">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ban status</Label>
                <Select
                  value={draft.banned}
                  onValueChange={(v: ToolbarState['banned']) => setDraft((d) => ({ ...d, banned: v }))}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    <SelectItem value="yes">Banned</SelectItem>
                    <SelectItem value="no">Not banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email verified</Label>
                <Select
                  value={draft.emailVerified}
                  onValueChange={(v: ToolbarState['emailVerified']) =>
                    setDraft((d) => ({ ...d, emailVerified: v }))
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    <SelectItem value="yes">Verified</SelectItem>
                    <SelectItem value="no">Not verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Apply filters</Button>
              <Button type="button" variant="outline" onClick={() => clearAll()}>
                Clear
              </Button>
              {hasActiveFilters(applied) ? (
                <span className="self-center text-xs text-muted-foreground">Filters are active.</span>
              ) : null}
            </div>
          </form>
        </CardHeader>

        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users on this page. Try another search or broaden filters.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead>Role / KYC</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row: AdminUserRow) => (
                    <TableRow key={row.user_id}>
                      <TableCell className="align-top">
                        <span className="font-medium">{row.name || '—'}</span>
                        <div className="mt-1 text-xs text-muted-foreground">{row.email}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="text-sm">{row.role ?? '—'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          KYC {row.kyc_status ?? '—'}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-1">
                          {row.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge>
                          )}
                          {row.email_verified ? (
                            <Badge variant="outline">Email verified</Badge>
                          ) : null}
                          {row.two_factor_enabled ? (
                            <Badge variant="outline">2FA</Badge>
                          ) : null}
                        </div>
                        {row.admin_actions?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {row.admin_actions.slice(0, 4).map((a) => (
                              <Badge key={a} variant="outline" className="text-[10px] font-normal">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top text-muted-foreground text-xs">
                        <div>
                          Registered <span className="text-foreground">{formatDt(row.created_at)}</span>
                        </div>
                        <div className="mt-1">
                          Last session{' '}
                          <span className="text-foreground">{formatDt(row.last_active_session)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <Button size="sm" variant="outline" className="rounded-full" asChild>
                          <Link href={`/admin/users/${encodeURIComponent(row.user_id)}`}>Workspace</Link>
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
