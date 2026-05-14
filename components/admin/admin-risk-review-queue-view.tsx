'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, XCircle } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  assignReviewItem,
  fetchReviewQueue,
  resolveReviewItem,
} from '@/lib/admin/admin-risk-monitoring-api'
import type { AdminReviewQueueItem } from '@/lib/admin/admin-risk-monitoring-api'
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

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'in_review':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'resolved':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'escalated':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'dismissed':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function AdminRiskReviewQueueView({
  accessToken,
  adminId,
}: {
  accessToken: string
  adminId: string
}) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const pageSize = 20

  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const [selectedItem, setSelectedItem] = useState<AdminReviewQueueItem | null>(null)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolveAction, setResolveAction] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')

  const queueQuery = useQuery({
    queryKey: ['admin', 'risk', 'review-queue', page, pageSize, statusFilter, priorityFilter, typeFilter],
    queryFn: () =>
      fetchReviewQueue(accessToken, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        item_type: typeFilter || undefined,
        page,
        page_size: pageSize,
      }),
    enabled: Boolean(accessToken),
  })

  const assignMutation = useMutation({
    mutationFn: (itemId: string) => assignReviewItem(accessToken, itemId, adminId),
    onSuccess: () => {
      toast.success('Item assigned to you')
      void qc.invalidateQueries({ queryKey: ['admin', 'risk', 'review-queue'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const resolveMutation = useMutation({
    mutationFn: () => {
      if (!selectedItem) throw new Error('No item selected')
      return resolveReviewItem(accessToken, selectedItem.id, adminId, resolveAction, resolveNotes)
    },
    onSuccess: () => {
      toast.success('Review item resolved')
      setResolveDialogOpen(false)
      setSelectedItem(null)
      setResolveAction('')
      setResolveNotes('')
      void qc.invalidateQueries({ queryKey: ['admin', 'risk', 'review-queue'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const items = queueQuery.data?.items ?? []
  const total = queueQuery.data?.total ?? 0
  const canPrev = page > 1
  const canNext = items.length >= pageSize

  const handleResolve = (item: AdminReviewQueueItem) => {
    setSelectedItem(item)
    setResolveDialogOpen(true)
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header>
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Risk monitoring</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Review Queue
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Manual review queue for flagged escrows, users, and suspicious patterns. Assign items to
          yourself and resolve with appropriate actions.
        </p>
      </header>

      {queueQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load review queue</AlertTitle>
          <AlertDescription>
            {queueQuery.error instanceof Error ? queueQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Filters */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
          <CardDescription>Filter review items by status, priority, and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority-filter">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority-filter">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="escrow">Escrow</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="dispute">Dispute</SelectItem>
                  <SelectItem value="transaction_pattern">Transaction Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Review Items ({total} total)
          </CardTitle>
          <CardDescription>Page {page} of review queue</CardDescription>
        </CardHeader>
        <CardContent>
          {queueQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No items in queue with current filters
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Risk Factors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: AdminReviewQueueItem) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getPriorityColor(item.priority))}
                        >
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.item_type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[200px] flex-wrap gap-1">
                          {item.risk_factors.slice(0, 3).map((factor) => (
                            <Badge key={factor} variant="secondary" className="text-[10px]">
                              {factor}
                            </Badge>
                          ))}
                          {item.risk_factors.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{item.risk_factors.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getStatusColor(item.status))}
                        >
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDt(item.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === 'pending' && !item.assigned_to && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => assignMutation.mutate(item.id)}
                              disabled={assignMutation.isPending}
                            >
                              Assign
                            </Button>
                          )}
                          {(item.status === 'pending' || item.status === 'in_review') && (
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleResolve(item)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
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
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </CardFooter>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Review Item</DialogTitle>
            <DialogDescription>
              {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium">Description</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedItem.description}</p>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedItem.risk_factors.map((factor) => (
                    <Badge key={factor} variant="secondary" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolve-action">Action</Label>
                <Select value={resolveAction} onValueChange={setResolveAction}>
                  <SelectTrigger id="resolve-action">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-green-600" />
                        Approve - No risk found
                      </div>
                    </SelectItem>
                    <SelectItem value="restrict">
                      <div className="flex items-center gap-2">
                        <XCircle className="size-4 text-red-600" />
                        Restrict - Confirmed risk
                      </div>
                    </SelectItem>
                    <SelectItem value="escalate">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="size-4 text-orange-600" />
                        Escalate - Needs senior review
                      </div>
                    </SelectItem>
                    <SelectItem value="dismiss">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-gray-600" />
                        Dismiss - False positive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolve-notes">Resolution Notes</Label>
                <Textarea
                  id="resolve-notes"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Document your decision and any actions taken..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false)
                setResolveAction('')
                setResolveNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!resolveAction || resolveMutation.isPending}
              onClick={() => resolveMutation.mutate()}
            >
              Submit Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
