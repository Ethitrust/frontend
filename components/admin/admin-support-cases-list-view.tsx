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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAdminUserSummaries } from '@/hooks/admin/use-admin-user-summaries'
import type { AdminSupportCaseCreateBody, AdminSupportCaseListRow } from '@/lib/admin/admin-api-types'
import {
  fetchAdminSupportCaseList,
  patchAdminSupportCase,
  postAdminSupportCase,
} from '@/lib/admin/admin-configuration-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

const LIST_QK = ['admin', 'support-cases', 'list'] as const

function dt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

function clip(s?: string | null, max = 72) {
  if (!s) return ''
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso?.trim()) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

function datetimeLocalToIso(local: string): string | null {
  const t = local.trim()
  if (!t) return null
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function buildCreateBody(fields: {
  relatedUserId: string
  relatedEscrowId: string
  relatedDisputeId: string
  priority: string
  status: string
  assigneeUserId: string
  slaLocal: string
  notes: string
}): AdminSupportCaseCreateBody {
  const body: AdminSupportCaseCreateBody = {
    priority: fields.priority.trim() || 'medium',
    status: fields.status.trim() || 'open',
  }
  const ru = fields.relatedUserId.trim()
  const re = fields.relatedEscrowId.trim()
  const rd = fields.relatedDisputeId.trim()
  const au = fields.assigneeUserId.trim()
  if (ru) body.related_user_id = ru
  if (re) body.related_escrow_id = re
  if (rd) body.related_dispute_id = rd
  if (au) body.assignee_user_id = au
  const sla = datetimeLocalToIso(fields.slaLocal)
  if (sla) body.sla_due_at = sla
  const notes = fields.notes.trim()
  if (notes) body.notes = notes
  return body
}

export function AdminSupportCasesListView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [createOpen, setCreateOpen] = useState(false)
  const [crRelatedUser, setCrRelatedUser] = useState('')
  const [crRelatedEscrow, setCrRelatedEscrow] = useState('')
  const [crRelatedDispute, setCrRelatedDispute] = useState('')
  const [crPriority, setCrPriority] = useState('medium')
  const [crStatus, setCrStatus] = useState('open')
  const [crAssignee, setCrAssignee] = useState('')
  const [crSla, setCrSla] = useState('')
  const [crNotes, setCrNotes] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<AdminSupportCaseListRow | null>(null)
  const [editPriority, setEditPriority] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editAssignee, setEditAssignee] = useState('')
  const [editSla, setEditSla] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const resetCreate = () => {
    setCrRelatedUser('')
    setCrRelatedEscrow('')
    setCrRelatedDispute('')
    setCrPriority('medium')
    setCrStatus('open')
    setCrAssignee('')
    setCrSla('')
    setCrNotes('')
  }

  const listQuery = useQuery({
    queryKey: [...LIST_QK, page, pageSize],
    queryFn: () => fetchAdminSupportCaseList(accessToken, page, pageSize),
    enabled: Boolean(accessToken),
  })

  const items = listQuery.data?.items ?? []
  const canPrev = page > 1
  const canNext = Boolean(listQuery.data) && items.length >= pageSize

  const assigneeIds = useMemo(() => {
    const s = new Set<string>()
    for (const row of items as AdminSupportCaseListRow[]) {
      const id = typeof row.assignee_user_id === 'string' ? row.assignee_user_id.trim() : ''
      if (id) s.add(id)
    }
    return [...s]
  }, [items])

  const { byId: assigneesById, pendingById: assigneePendingById } = useAdminUserSummaries(accessToken, assigneeIds)

  const createMutation = useMutation({
    mutationFn: () =>
      postAdminSupportCase(
        accessToken,
        buildCreateBody({
          relatedUserId: crRelatedUser,
          relatedEscrowId: crRelatedEscrow,
          relatedDisputeId: crRelatedDispute,
          priority: crPriority,
          status: crStatus,
          assigneeUserId: crAssignee,
          slaLocal: crSla,
          notes: crNotes,
        }),
      ),
    onSuccess: () => {
      toast.success('Support case created')
      setCreateOpen(false)
      resetCreate()
      void qc.invalidateQueries({ queryKey: ['admin', 'support-cases'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const patchMutation = useMutation({
    mutationFn: async () => {
      if (!editRow) throw new Error('No case selected')
      const pr = editPriority.trim()
      const st = editStatus.trim()
      if (!pr || !st) throw new Error('Priority and status are required')
      const slaRaw = editSla.trim()
      let slaDue: string | null
      if (!slaRaw) {
        slaDue = null
      } else {
        const iso = datetimeLocalToIso(editSla)
        if (!iso) throw new Error('Invalid SLA date')
        slaDue = iso
      }
      return patchAdminSupportCase(accessToken, editRow.case_id, {
        priority: pr,
        status: st,
        assignee_user_id: editAssignee.trim() ? editAssignee.trim() : null,
        sla_due_at: slaDue,
        notes: editNotes.trim() ? editNotes.trim() : null,
      })
    },
    onSuccess: () => {
      toast.success('Case updated')
      setEditOpen(false)
      setEditRow(null)
      void qc.invalidateQueries({ queryKey: ['admin', 'support-cases'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openEdit = (row: AdminSupportCaseListRow) => {
    setEditRow(row)
    setEditPriority(row.priority ?? '')
    setEditStatus(row.status ?? '')
    setEditAssignee(row.assignee_user_id ?? '')
    setEditSla(isoToDatetimeLocal(row.sla_due_at))
    setEditNotes(row.notes ?? '')
    setEditOpen(true)
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Configuration</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>Support cases</h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Operator queue for inbound issues — triage SLA, assignments, and status without leaving Ethi‑Trust Admin.
        </p>
      </header>

      {listQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load support cases</AlertTitle>
          <AlertDescription>
            {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base font-semibold">Cases</CardTitle>
            <CardDescription>Page {page}.</CardDescription>
          </div>
          <Button type="button" size="sm" className="rounded-full" onClick={() => setCreateOpen(true)}>
            New case
          </Button>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rows on this page.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Related</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>SLA due</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as AdminSupportCaseListRow[]).map((row) => (
                    <TableRow key={row.case_id}>
                      <TableCell className="max-w-32 font-mono text-[11px] wrap-break-word">
                        <span title={row.case_id}>{clip(row.case_id, 14)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status ?? '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.priority ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-48 space-y-1 text-xs">
                        {row.related_user_id ? (
                          <div>
                            <span className="text-muted-foreground">User </span>
                            <Link className="text-primary underline underline-offset-2" href={`/admin/users/${row.related_user_id}`}>
                              {clip(row.related_user_id, 18)}
                            </Link>
                          </div>
                        ) : null}
                        {row.related_escrow_id ? (
                          <div>
                            <span className="text-muted-foreground">Escrow </span>
                            <Link className="text-primary underline underline-offset-2" href={`/admin/escrows/${row.related_escrow_id}`}>
                              {clip(row.related_escrow_id, 18)}
                            </Link>
                          </div>
                        ) : null}
                        {row.related_dispute_id ? (
                          <div>
                            <span className="text-muted-foreground">Dispute </span>
                            <Link className="text-primary underline underline-offset-2" href={`/admin/disputes/${row.related_dispute_id}`}>
                              {clip(row.related_dispute_id, 18)}
                            </Link>
                          </div>
                        ) : null}
                        {!row.related_user_id && !row.related_escrow_id && !row.related_dispute_id ? (
                          <span className="text-muted-foreground">—</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(() => {
                          const aid = row.assignee_user_id?.trim()
                          if (!aid) return '—'
                          const u = assigneesById[aid]
                          const pending = assigneePendingById[aid]
                          if (pending) return <span className="text-muted-foreground">Loading…</span>
                          const label = u?.name?.trim() || u?.email?.trim() || clip(aid, 12)
                          return (
                            <Link href={`/admin/users/${aid}`} className="text-primary underline underline-offset-2">
                              {label}
                            </Link>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{dt(row.sla_due_at)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{dt(row.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(row)}>
                          Edit
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

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          if (!o) resetCreate()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New support case</DialogTitle>
            <DialogDescription>Omit unrelated IDs — they are forwarded to upstream validation as provided.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="sc-related-user">Related user ID</Label>
              <Input id="sc-related-user" value={crRelatedUser} onChange={(ev) => setCrRelatedUser(ev.target.value)} placeholder="UUID" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sc-related-escrow">Related escrow ID</Label>
              <Input id="sc-related-escrow" value={crRelatedEscrow} onChange={(ev) => setCrRelatedEscrow(ev.target.value)} placeholder="UUID" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sc-related-dispute">Related dispute ID</Label>
              <Input id="sc-related-dispute" value={crRelatedDispute} onChange={(ev) => setCrRelatedDispute(ev.target.value)} placeholder="UUID" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="sc-priority">Priority</Label>
                <Input id="sc-priority" value={crPriority} onChange={(ev) => setCrPriority(ev.target.value)} placeholder="medium" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sc-status">Status</Label>
                <Input id="sc-status" value={crStatus} onChange={(ev) => setCrStatus(ev.target.value)} placeholder="open" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sc-assignee">Assignee user ID</Label>
              <Input id="sc-assignee" value={crAssignee} onChange={(ev) => setCrAssignee(ev.target.value)} placeholder="UUID" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sc-sla">SLA due (local)</Label>
              <Input id="sc-sla" type="datetime-local" value={crSla} onChange={(ev) => setCrSla(ev.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sc-notes">Notes</Label>
              <Textarea id="sc-notes" rows={3} value={crNotes} onChange={(ev) => setCrNotes(ev.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o)
          if (!o) setEditRow(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update case</DialogTitle>
            <DialogDescription>
              {editRow ? <span className="font-mono text-[11px]">{editRow.case_id}</span> : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="sc-edit-priority">Priority</Label>
                <Input id="sc-edit-priority" value={editPriority} onChange={(ev) => setEditPriority(ev.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sc-edit-status">Status</Label>
                <Input id="sc-edit-status" value={editStatus} onChange={(ev) => setEditStatus(ev.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sc-edit-assignee">Assignee user ID</Label>
              <Input id="sc-edit-assignee" value={editAssignee} onChange={(ev) => setEditAssignee(ev.target.value)} placeholder="Blank to clear" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sc-edit-sla">SLA due (local)</Label>
              <Input id="sc-edit-sla" type="datetime-local" value={editSla} onChange={(ev) => setEditSla(ev.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sc-edit-notes">Notes</Label>
              <Textarea id="sc-edit-notes" rows={4} value={editNotes} onChange={(ev) => setEditNotes(ev.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={patchMutation.isPending || !editRow} onClick={() => patchMutation.mutate()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
