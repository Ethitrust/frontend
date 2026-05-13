'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarIcon,
  CheckIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  XIcon,
  AlertCircleIcon,
  ClockIcon,
  HandCoinsIcon,
  CalendarPlusIcon,
  BanIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { postProposeAdjustment, postRespondToAdjustment } from '@/lib/escrows/me-escrows-api'
import type { EscrowAdjustmentRow, EscrowRow } from '@/lib/escrows/escrow-list-types'
import { formatEscrowMoney } from '@/lib/escrows/format-escrow'

interface EscrowSettlementNegotiationProps {
  accessToken: string
  escrow: EscrowRow
  adjustments: EscrowAdjustmentRow[]
  currentUserId: string
}

export function EscrowSettlementNegotiation({
  accessToken,
  escrow,
  adjustments,
  currentUserId,
}: EscrowSettlementNegotiationProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  
  const [type, setType] = React.useState<'mutual_cancellation' | 'partial_refund' | 'deadline_extension'>('mutual_cancellation')
  const [amount, setAmount] = React.useState<string>('')
  const [date, setDate] = React.useState<string>('')
  const [note, setNote] = React.useState('')

  const adjustmentsArr = Array.isArray(adjustments) ? adjustments : []
  const pendingAdjustment = adjustmentsArr.find((a) => a.status === 'pending')

  const proposeMutation = useMutation({
    mutationFn: async () => {
      return postProposeAdjustment(accessToken, escrow.id, {
        adjustment_type: type,
        proposed_amount: type === 'partial_refund' ? Number(amount) : undefined,
        new_delivery_date: type === 'deadline_extension' ? date : undefined,
        note,
      })
    },
    onSuccess: () => {
      toast.success('Proposal sent successfully')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['me', 'escrow', escrow.id] })
      router.refresh()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to send proposal')
    },
  })

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'reject' }) => {
      return postRespondToAdjustment(accessToken, id, action)
    },
    onSuccess: (_, variables) => {
      toast.success(`Proposal ${variables.action}ed successfully`)
      queryClient.invalidateQueries({ queryKey: ['me', 'escrow', escrow.id] })
      router.refresh()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to respond')
    },
  })

  if (escrow.status === 'completed' || escrow.status === 'cancelled' || escrow.status === 'refunded' || escrow.status === 'disputed') {
    return null
  }

  return (
    <div className="space-y-4">
      {pendingAdjustment && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClockIcon className="size-4 text-primary" />
                Pending Settlement Proposal
              </CardTitle>
              <Badge variant="outline" className="bg-background capitalize">
                {pendingAdjustment.adjustment_type.replace(/_/g, ' ')}
              </Badge>
            </div>
            <CardDescription>
              {pendingAdjustment.proposed_by_user_id === currentUserId
                ? 'You proposed this change. Waiting for the other party to respond.'
                : 'The other party has proposed a change to this escrow.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3 text-sm space-y-2">
            {pendingAdjustment.adjustment_type === 'partial_refund' && (
              <div className="flex justify-between items-center bg-background p-2 rounded border">
                <span className="text-muted-foreground font-medium">New Payout:</span>
                <span className="font-bold text-lg">{formatEscrowMoney(pendingAdjustment.proposed_amount || 0, escrow.currency)}</span>
              </div>
            )}
            {pendingAdjustment.adjustment_type === 'deadline_extension' && (
              <div className="flex justify-between items-center bg-background p-2 rounded border">
                <span className="text-muted-foreground font-medium">New Deadline:</span>
                <span className="font-bold">
                  {(() => {
                    if (!pendingAdjustment.new_delivery_date) return 'N/A'
                    try {
                      const d = new Date(pendingAdjustment.new_delivery_date)
                      if (isNaN(d.getTime())) return 'Invalid Date'
                      return format(d, 'PPP')
                    } catch {
                      return 'Invalid Date'
                    }
                  })()}
                </span>
              </div>
            )}
            {pendingAdjustment.note && (
              <div className="p-2 bg-background/50 rounded italic text-muted-foreground border-l-2 border-primary">
                "{pendingAdjustment.note}"
              </div>
            )}
          </CardContent>
          {pendingAdjustment.proposed_by_user_id !== currentUserId && (
            <CardFooter className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => respondMutation.mutate({ id: pendingAdjustment.id, action: 'accept' })}
                disabled={respondMutation.isPending}
              >
                {respondMutation.isPending ? 'Processing...' : 'Accept Proposal'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => respondMutation.mutate({ id: pendingAdjustment.id, action: 'reject' })}
                disabled={respondMutation.isPending}
              >
                Reject
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {!pendingAdjustment && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2 border-dashed">
              <RotateCcwIcon className="size-4" />
              Propose Settlement Change
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Propose Settlement</DialogTitle>
              <DialogDescription>
                Propose a financial adjustment or timeline change to resolve issues without a formal dispute.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Adjustment Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutual_cancellation">
                      <div className="flex items-center gap-2">
                        <BanIcon className="size-4 text-destructive" />
                        <span>Mutual Cancellation (Full Refund)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="partial_refund">
                      <div className="flex items-center gap-2">
                        <HandCoinsIcon className="size-4 text-green-600" />
                        <span>Partial Discount / Refund</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="deadline_extension">
                      <div className="flex items-center gap-2">
                        <CalendarPlusIcon className="size-4 text-blue-600" />
                        <span>Deadline Extension</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === 'partial_refund' && (
                <div className="grid gap-2">
                  <Label htmlFor="amount">New Payout Amount (ETB)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Original: ${escrow.amount}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    This is the new total amount the seller will receive. The remainder will be refunded to the buyer.
                  </p>
                </div>
              )}

              {type === 'deadline_extension' && (
                <div className="grid gap-2">
                  <Label htmlFor="date">New Delivery Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="note">Note to other party</Label>
                <Textarea
                  id="note"
                  placeholder="Explain why you are proposing this change..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => proposeMutation.mutate()}
                disabled={proposeMutation.isPending}
              >
                {proposeMutation.isPending ? 'Sending...' : 'Send Proposal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
