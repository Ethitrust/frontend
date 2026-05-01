/** Shapes from `docs/apidoc.md` — org-escrows */

export type OrgEscrowVolumePoint = {
  date: string
  count: number
  total_amount: number
}

export type OrgEscrowReportSummary = {
  organization_id: string
  period_from: string
  period_to: string
  total_escrows: number
  active_escrow_count: number
  completion_rate: number
  dispute_rate: number
  avg_settlement_time_hours: number
  volume_over_time: OrgEscrowVolumePoint[]
}

export type OrgEscrowListItem = {
  escrow_id: string
  organization_id: string
  title: string
  status: string
  is_active: boolean
  amount: number
  currency: string
  receiver_email: string
  funded_amount: number
  created_at: string
  updated_at: string
  expires_at?: string | null
}

export type OrgEscrowsListResponse = {
  items: OrgEscrowListItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type OrgEscrowRiskFlag = {
  code: string
  message: string
  severity: string
}

export type OrgEscrowLatestEvent = {
  event_type: string
  actor: string
  timestamp: string
  metadata?: Record<string, unknown> | null
}

export type OrgEscrowDetail = {
  escrow_id: string
  organization_id: string
  status: string
  is_active: boolean
  can_cancel: boolean
  can_resend_invite: boolean
  can_accept: boolean
  expires_at: string
  funded_amount: number
  currency: string
  amount: number
  updated_at: string
  title: string
  description: string
  escrow_type: string
  initiator_role: string
  receiver_email: string
  receiver_id?: string | null
  fee_amount: number
  who_pays_fees: string
  created_at: string
  progress_percentage: number
  current_phase: string
  next_action: string
  risk_flags: OrgEscrowRiskFlag[]
  latest_event?: OrgEscrowLatestEvent | null
}

export type OrgEscrowAuditEventItem = {
  event_id: string
  escrow_id: string
  actor: string
  action: string
  timestamp: string
  metadata?: Record<string, unknown> | null
}

export type OrgEscrowEventsResponse = {
  escrow_id: string
  events: OrgEscrowAuditEventItem[]
  total: number
}

export type OrgEscrowHealth = {
  escrow_id: string
  is_active: boolean
  is_expired: boolean
  is_fundable: boolean
  is_cancellable: boolean
  is_disputable: boolean
  is_settled: boolean
}

export type OrgWebhookLogRow = {
  id: string
  event_type: string
  target_url: string
  http_status: number
  attempt: number
  delivery_status: string
  error_message?: string | null
  created_at: string
  next_retry_at?: string | null
}

export type OrgEscrowCreateResponse = {
  id: string
  escrow_type: string
  status: string
  title?: string
  org_id?: string
}
