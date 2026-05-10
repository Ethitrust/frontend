'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchAdminUsers, postAdminCreateModerator } from '@/lib/admin/admin-people-api'
import type { AdminCreateModeratorBody, AdminModeratorRow, AdminUserRow } from '@/lib/admin/admin-api-types'
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

export function AdminModeratorsView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [searchDraft, setSearchDraft] = useState('')
  const [searchApplied, setSearchApplied] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<AdminCreateModeratorBody>({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<AdminModeratorRow | null>(null)

  const listQuery = useQuery({
    queryKey: ['admin', 'moderators', 'list', page, pageSize, searchApplied],
    queryFn: () =>
      fetchAdminUsers(accessToken, page, pageSize, {
        role: 'moderator',
        search: searchApplied.trim() || undefined,
      }),
    enabled: Boolean(accessToken),
  })

  function applySearch() {
    setSearchApplied(searchDraft)
    setPage(1)
  }

  function clearSearch() {
    setSearchDraft('')
    setSearchApplied('')
    setPage(1)
  }

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  function setField<K extends keyof AdminCreateModeratorBody>(
    key: K,
    value: AdminCreateModeratorBody[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!form.first_name.trim()) errors.first_name = 'First name is required'
    if (!form.last_name.trim()) errors.last_name = 'Last name is required'
    if (!form.phone_number.trim()) errors.phone_number = 'Phone number is required'
    if (!form.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address'
    }
    if (!form.password) {
      errors.password = 'Password is required'
    } else if (form.password.length < 8) {
      errors.password = 'Use at least 8 characters'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const createMutation = useMutation({
    mutationFn: () => postAdminCreateModerator(accessToken, form),
    onSuccess: (data) => {
      toast.success('Moderator created successfully')
      setCreated(data as AdminModeratorRow)
      setForm({ first_name: '', last_name: '', phone_number: '', email: '', password: '' })
      setFieldErrors({})
      void qc.invalidateQueries({ queryKey: ['admin', 'moderators', 'list'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validateForm()) return
    createMutation.mutate()
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>People & verification</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Moderators
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>
            Platform moderators directory. Open a workspace to review moderation controls and audit trails.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full shrink-0"
          onClick={() => {
            setDialogOpen(true)
            setCreated(null)
          }}
        >
          <Plus className="size-4 mr-2" aria-hidden />
          Create moderator
        </Button>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load moderators</AlertTitle>
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
              Page {page}. Moderators are filtered by role. Use search to narrow results.
            </CardDescription>
          </div>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(ev) => {
              ev.preventDefault()
              applySearch()
            }}
          >
            <Input
              value={searchDraft}
              onChange={(ev) => setSearchDraft(ev.target.value)}
              placeholder="Search name, email, or user id"
              className="max-w-sm"
              autoComplete="off"
            />
            <Button type="submit">Search</Button>
            {searchApplied ? (
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            ) : null}
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
              No moderators on this page. Try another search or create one.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead>Role</TableHead>
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
                        <Badge variant="secondary">{row.role ?? '—'}</Badge>
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
                          <Link href={`/admin/users/${encodeURIComponent(row.user_id)}`}>
                            Workspace
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

      {/* Create moderator dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New moderator</DialogTitle>
            <DialogDescription>
              Create a platform moderator account. An email verification will be sent automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mod-first-name">First name</Label>
                <Input
                  id="mod-first-name"
                  value={form.first_name}
                  onChange={(ev) => setField('first_name', ev.target.value)}
                  placeholder="e.g. Abebe"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.first_name)}
                />
                {fieldErrors.first_name ? (
                  <p className="text-xs text-destructive">{fieldErrors.first_name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mod-last-name">Last name</Label>
                <Input
                  id="mod-last-name"
                  value={form.last_name}
                  onChange={(ev) => setField('last_name', ev.target.value)}
                  placeholder="e.g. Kebede"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.last_name)}
                />
                {fieldErrors.last_name ? (
                  <p className="text-xs text-destructive">{fieldErrors.last_name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mod-phone">Phone number</Label>
                <Input
                  id="mod-phone"
                  value={form.phone_number}
                  onChange={(ev) => setField('phone_number', ev.target.value)}
                  placeholder="+251 9xx xxx xxx"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.phone_number)}
                />
                {fieldErrors.phone_number ? (
                  <p className="text-xs text-destructive">{fieldErrors.phone_number}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mod-email">Email</Label>
                <Input
                  id="mod-email"
                  type="email"
                  value={form.email}
                  onChange={(ev) => setField('email', ev.target.value)}
                  placeholder="moderator@example.com"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email ? (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mod-password">Password</Label>
                <Input
                  id="mod-password"
                  type="password"
                  value={form.password}
                  onChange={(ev) => setField('password', ev.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                ) : null}
              </div>
            </div>

            {created ? (
              <>
                <Separator />
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{created.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{created.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span className="font-medium capitalize">{created.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email verified</span>
                    <span className="font-medium">{created.email_verified ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating…' : 'Create moderator'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
