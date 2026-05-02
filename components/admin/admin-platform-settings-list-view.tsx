'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAdminUserSummaries } from '@/hooks/admin/use-admin-user-summaries'
import type { AdminPlatformSettingRow } from '@/lib/admin/admin-api-types'
import {
  fetchAdminPlatformSettingList,
  patchAdminPlatformSetting,
} from '@/lib/admin/admin-configuration-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

const SETTINGS_LIST_QK = ['admin', 'platform-settings', 'list'] as const

function dt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

function clip(s?: string | null, max = 96) {
  if (!s) return ''
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

const UNCATEGORIZED = 'Uncategorized'

function normalizeCategory(row: AdminPlatformSettingRow): string {
  const c = row.category
  const t = typeof c === 'string' ? c.trim() : ''
  return t || UNCATEGORIZED
}

export function AdminPlatformSettingsListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<AdminPlatformSettingRow | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editReason, setEditReason] = useState('')

  const listQuery = useQuery({
    queryKey: [...SETTINGS_LIST_QK, page, pageSize],
    queryFn: () => fetchAdminPlatformSettingList(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const updaterIds = useMemo(() => {
    const s = new Set<string>()
    for (const row of items as AdminPlatformSettingRow[]) {
      const id = typeof row.updated_by === 'string' ? row.updated_by.trim() : ''
      if (id) s.add(id)
    }
    return [...s]
  }, [items])

  const { byId: updatersById, pendingById: updaterPendingById } = useAdminUserSummaries(accessToken, updaterIds)

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, AdminPlatformSettingRow[]>()
    for (const row of items as AdminPlatformSettingRow[]) {
      const label = normalizeCategory(row)
      const list = map.get(label) ?? []
      list.push(row)
      map.set(label, list)
    }
    const keys = [...map.keys()].sort((a, b) => {
      if (a === UNCATEGORIZED) return 1
      if (b === UNCATEGORIZED) return -1
      return a.localeCompare(b, undefined, { sensitivity: 'base' })
    })
    return keys.map((category) => ({
      category,
      rows: [...(map.get(category) ?? [])].sort((r1, r2) => r1.key.localeCompare(r2.key, undefined, { sensitivity: 'base' })),
    }))
  }, [items])

  const patchMutation = useMutation({
    mutationFn: async () => {
      if (!editRow?.key.trim()) throw new Error('Missing setting')
      const value = editValue.trim()
      if (!value) throw new Error('Value is required')
      const reason = editReason.trim()
      return patchAdminPlatformSetting(accessToken, editRow.key, {
        value,
        reason: reason || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Setting updated')
      setEditOpen(false)
      setEditRow(null)
      setEditValue('')
      setEditReason('')
      void qc.invalidateQueries({ queryKey: ['admin', 'platform-settings'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openEdit = (row: AdminPlatformSettingRow) => {
    setEditRow(row)
    setEditValue(row.value ?? '')
    setEditReason('')
    setEditOpen(true)
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Configuration</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>Platform settings</h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Tunable knobs exposed by upstream — edits should include an operator reason whenever policy asks for traceability.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load settings</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-10 space-y-10">
        {listQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No settings on this page.</p>
        ) : (
          groupedByCategory.map(({ category, rows }, sectionIdx) => (
            <section key={category} aria-labelledby={`ps-cat-heading-${sectionIdx}`}>
              <div className="flex flex-wrap items-baseline gap-3 border-border border-b pb-3">
                <h2
                  id={`ps-cat-heading-${sectionIdx}`}
                  className="font-serif text-lg font-semibold tracking-tight text-foreground"
                >
                  {category}
                </h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {rows.length} setting{rows.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((row) => (
                  <Card key={row.key} className="flex flex-col shadow-sm">
                    <CardHeader className="space-y-3 pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="font-mono text-[11px] leading-snug wrap-break-word" title={row.key}>
                          {row.key}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 rounded-full"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline">{row.value_type ?? '—'}</Badge>
                        {typeof row.is_runtime_enforced === 'boolean' ? (
                          <Badge variant={row.is_runtime_enforced ? 'secondary' : 'outline'}>
                            {row.is_runtime_enforced ? 'Runtime enforced' : 'Not enforced'}
                          </Badge>
                        ) : null}
                      </div>
                      {row.description ? (
                        <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                          {row.description}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    <Separator />
                    <CardContent className="flex flex-1 flex-col gap-3 pt-4">
                      <div>
                        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Value</p>
                        <pre className="mt-1 max-h-36 overflow-auto rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs wrap-break-word whitespace-pre-wrap">
                          {row.value ?? '—'}
                        </pre>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        <span className="font-medium text-foreground/80">Last updated</span>
                        <span className="mx-1.5 text-border">·</span>
                        {dt(row.updated_at)}
                        <span className="mx-1.5 text-border">·</span>
                        {(() => {
                          const uid = row.updated_by?.trim()
                          if (!uid) return <span className="text-muted-foreground">unknown actor</span>
                          const u = updatersById[uid]
                          const pending = updaterPendingById[uid]
                          if (pending) return <span>Loading actor…</span>
                          const label = u?.name?.trim() || u?.email?.trim() || clip(uid, 12)
                          return (
                            <Link href={`/admin/users/${uid}`} className="text-primary underline underline-offset-2">
                              {label}
                            </Link>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <footer className="mt-12 flex flex-wrap justify-between gap-4 border-border border-t pt-6">
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
      </footer>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
            setEditRow(null)
            setEditValue('')
            setEditReason('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit setting</DialogTitle>
            <DialogDescription className="font-mono text-[11px] wrap-break-word">
              {editRow?.key}
            </DialogDescription>
          </DialogHeader>
          {editRow ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Category · type · runtime</span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{editRow.category ?? '—'}</Badge>
                  <Badge variant="secondary">{editRow.value_type ?? '—'}</Badge>
                  {typeof editRow.is_runtime_enforced === 'boolean' ? (
                    <Badge>{editRow.is_runtime_enforced ? 'Runtime enforced' : 'Not enforced'}</Badge>
                  ) : null}
                </div>
              </div>
              {editRow.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{editRow.description}</p>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="ps-value">New value</Label>
                <Textarea id="ps-value" rows={3} value={editValue} onChange={(ev) => setEditValue(ev.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ps-reason">Reason (optional audit note)</Label>
                <Textarea
                  id="ps-reason"
                  rows={2}
                  value={editReason}
                  onChange={(ev) => setEditReason(ev.target.value)}
                  placeholder="Why is this changing?"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={patchMutation.isPending || !editRow} onClick={() => patchMutation.mutate()}>
              Save change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
