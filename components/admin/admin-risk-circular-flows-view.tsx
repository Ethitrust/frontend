'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, TrendingUp, XCircle } from 'lucide-react'
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
  fetchCircularFlows,
  investigateCircularFlow,
} from '@/lib/admin/admin-risk-monitoring-api'
import type { CircularFlowDetection } from '@/lib/admin/admin-risk-monitoring-api'
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

function getStatusColor(status: string) {
  switch (status) {
    case 'detected':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'investigating':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'confirmed':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'false_positive':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'resolved':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function AdminRiskCircularFlowsView({
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

  const [statusFilter, setStatusFilter] = useState<string>('detected')

  const [selectedFlow, setSelectedFlow] = useState<CircularFlowDetection | null>(null)
  const [investigateDialogOpen, setInvestigateDialogOpen] = useState(false)
  const [investigateAction, setInvestigateAction] = useState('')
  const [investigateNotes, setInvestigateNotes] = useState('')

  const flowsQuery = useQuery({
    queryKey: ['admin', 'risk', 'circular-flows', page, pageSize, statusFilter],
    queryFn: () =>
      fetchCircularFlows(accessToken, {
        status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        page,
        page_size: pageSize,
      }),
    enabled: Boolean(accessToken),
  })

  const investigateMutation = useMutation({
    mutationFn: () => {
      if (!selectedFlow) throw new Error('No flow selected')
      return investigateCircularFlow(
        accessToken,
        selectedFlow.id,
        adminId,
        investigateNotes,
        investigateAction as 'confirmed' | 'false_positive' | 'resolved'
      )
    },
    onSuccess: () => {
      toast.success('Investigation recorded')
      setInvestigateDialogOpen(false)
      setSelectedFlow(null)
      setInvestigateAction('')
      setInvestigateNotes('')
      void qc.invalidateQueries({ queryKey: ['admin', 'risk', 'circular-flows'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const detections = flowsQuery.data?.detections ?? []
  const total = flowsQuery.data?.total ?? 0
  const canPrev = page > 1
  const canNext = detections.length >= pageSize

  const handleInvestigate = (flow: CircularFlowDetection) => {
    setSelectedFlow(flow)
    setInvestigateDialogOpen(true)
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header>
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Risk monitoring</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Circular Flow Detection
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Detect and investigate circular money flows that may indicate money laundering or platform
          abuse through collusion.
        </p>
      </header>

      {flowsQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load circular flows</AlertTitle>
          <AlertDescription>
            {flowsQuery.error instanceof Error ? flowsQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Summary Stats */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flowsQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{total}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Under Investigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flowsQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {detections.filter((d) => d.status === 'investigating').length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flowsQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {detections.filter((d) => d.status === 'confirmed').length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              False Positives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flowsQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {detections.filter((d) => d.status === 'false_positive').length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filter</CardTitle>
          <CardDescription>Filter detections by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="detected">Detected</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Detections Table */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Circular Flow Detections ({total} total)
          </CardTitle>
          <CardDescription>Page {page} of detected circular flows</CardDescription>
        </CardHeader>
        <CardContent>
          {flowsQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : detections.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No circular flows detected with current filters
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow Path</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detections.map((flow: CircularFlowDetection) => (
                    <TableRow key={flow.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {flow.flow_path.slice(0, 4).map((userId, idx) => (
                              <span key={idx} className="font-mono text-xs text-muted-foreground">
                                {userId.slice(0, 8)}
                                {idx < Math.min(flow.flow_path.length - 1, 3) && ' →'}
                              </span>
                            ))}
                            {flow.flow_path.length > 4 && (
                              <span className="text-xs text-muted-foreground">
                                +{flow.flow_path.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{flow.cycle_length} users</TableCell>
                      <TableCell className="tabular-nums">
                        {flow.total_volume.toFixed(0)} ETB
                      </TableCell>
                      <TableCell className="tabular-nums">{flow.transaction_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{flow.risk_score.toFixed(1)}</span>
                          {flow.risk_score >= 70 && (
                            <AlertCircle className="size-4 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getStatusColor(flow.status))}
                        >
                          {flow.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDt(flow.detected_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(flow.status === 'detected' || flow.status === 'investigating') && (
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleInvestigate(flow)}
                          >
                            Investigate
                          </Button>
                        )}
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

      {/* Investigate Dialog */}
      <Dialog open={investigateDialogOpen} onOpenChange={setInvestigateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Investigate Circular Flow</DialogTitle>
            <DialogDescription>
              Review and classify this circular flow detection
            </DialogDescription>
          </DialogHeader>

          {selectedFlow && (
            <div className="space-y-4 py-4">
              {/* Flow Details */}
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cycle Length</span>
                    <span className="font-medium">{selectedFlow.cycle_length} users</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Volume</span>
                    <span className="font-medium">{selectedFlow.total_volume.toFixed(0)} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transactions</span>
                    <span className="font-medium">{selectedFlow.transaction_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Span</span>
                    <span className="font-medium">{selectedFlow.time_span_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Score</span>
                    <span className="font-bold text-red-600">{selectedFlow.risk_score.toFixed(1)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground">Flow Path</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedFlow.flow_path.map((userId, idx) => (
                      <span key={idx} className="font-mono text-xs">
                        {userId.slice(0, 8)}
                        {idx < selectedFlow.flow_path.length - 1 && ' → '}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground">Risk Indicators</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedFlow.risk_indicators.map((indicator) => (
                      <Badge key={indicator} variant="secondary" className="text-xs">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Investigation Form */}
              <div className="space-y-2">
                <Label htmlFor="investigate-action">Classification</Label>
                <Select value={investigateAction} onValueChange={setInvestigateAction}>
                  <SelectTrigger id="investigate-action">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">
                      <div className="flex items-center gap-2">
                        <XCircle className="size-4 text-red-600" />
                        Confirmed - Suspicious activity
                      </div>
                    </SelectItem>
                    <SelectItem value="false_positive">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-green-600" />
                        False Positive - Legitimate pattern
                      </div>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="size-4 text-blue-600" />
                        Resolved - Action taken
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investigate-notes">Investigation Notes</Label>
                <Textarea
                  id="investigate-notes"
                  value={investigateNotes}
                  onChange={(e) => setInvestigateNotes(e.target.value)}
                  placeholder="Document your findings, actions taken, and reasoning..."
                  rows={5}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInvestigateDialogOpen(false)
                setInvestigateAction('')
                setInvestigateNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!investigateAction || !investigateNotes.trim() || investigateMutation.isPending}
              onClick={() => investigateMutation.mutate()}
            >
              Submit Investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
