/** Row shape aligned with `docs/apidoc.md` `GET/POST /api/v1/escrows` payloads. */

export type EscrowRow = {
  id: string
  escrow_type: string
  status: string
  initiator_actor_type?: string | null
  initiator_id?: string | null
  initiator_org_id?: string | null
  receiver_id?: string | null
  receiver_email?: string | null
  initiator_role: string
  title: string
  description?: string | null
  currency: string
  amount: number
  fee_amount: number
  acceptance_criteria?: string | null
  inspection_period: number
  delivery_date: string
  dispute_window: number
  who_pays_fees: string
  org_id?: string | null
  offer_version?: number
  counter_status: string
  active_counter_offer_version?: number
  created_at: string
  updated_at: string
  invitation_sent?: boolean | null
}

/** @deprecated Prefer `EscrowRow` — retained for callers that imported `EscrowListItem`. */
export type EscrowListItem = EscrowRow

export type PaginatedEscrowsList = {
  items: EscrowRow[]
  page: number
  page_size: number
  total: number
}

export type MilestoneRow = {
  id: string
  escrow_id: string
  title: string
  description?: string | null
  amount: number
  due_date: string
  inspection_hrs: number
  status: string
  delivered_at?: string | null
  completed_at?: string | null
  sort_order?: number | null
}
export type EscrowEventRow = {
  id: string
  escrow_id: string
  user_id?: string | null
  event_type: string
  metadata?: Record<string, any> | null
  created_at: string
}

export type EscrowMessageRow = {
  id: string
  escrow_id: string
  sender_id: string
  message: string
  created_at: string
}

export type EscrowAdjustmentRow = {
  id: string
  escrow_id: string
  proposed_by_user_id: string
  adjustment_type: string
  status: string
  proposed_amount?: number | null
  new_delivery_date?: string | null
  note?: string | null
  created_at: string
  responded_at?: string | null
}
