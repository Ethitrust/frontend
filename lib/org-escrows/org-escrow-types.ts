/**
 * Types for the nested org-escrow surface:
 *   /api/v1/organizations/{org_id}/escrows/*
 *
 * Authorization: user bearer token; server enforces org membership/role.
 */

/** Public escrow statuses the org-escrow surface returns. */
export type OrgEscrowStatus =
  | 'invited'
  | 'pending'
  | 'active'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'expired'

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
  /** 0–1 */
  completion_rate: number
  /** 0–1 */
  dispute_rate: number
  avg_settlement_time_hours: number | null
  volume_over_time: OrgEscrowVolumePoint[]
}

export type OrgEscrowListItem = {
  escrow_id: string
  organization_id: string | null
  title: string
  /** See {@link OrgEscrowStatus}; the server may return other internal statuses. */
  status: string
  is_active: boolean
  /** Amount in birr (not cents). */
  amount: number
  currency: string
  receiver_email: string | null
  funded_amount: number
  created_at: string
  updated_at: string
  expires_at: string | null
}

export type OrgEscrowsListResponse = {
  items: OrgEscrowListItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

/** `GET /escrows/{escrow_id}` — status flags. */
export type OrgEscrowStatusFlags = {
  escrow_id: string
  organization_id: string | null
  status: string
  is_active: boolean
  can_cancel: boolean
  can_resend_invite: boolean
  can_accept: boolean
  expires_at: string | null
  funded_amount: number
  currency: string
  amount: number
  updated_at: string
}

export type OrgEscrowRiskFlag = {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high' | string
}

export type OrgEscrowLatestEvent = {
  event_type: string
  actor: string
  timestamp: string
  metadata?: Record<string, unknown> | null
}

/** `GET /escrows/{escrow_id}/detail` — extends the status-flags payload. */
export type OrgEscrowDetail = OrgEscrowStatusFlags & {
  title: string
  description: string | null
  escrow_type: string
  initiator_role: string
  receiver_email: string | null
  receiver_id: string | null
  fee_amount: number
  who_pays_fees: string
  created_at: string
  /** 0–100 */
  progress_percentage: number
  current_phase: string
  next_action: string | null
  risk_flags: OrgEscrowRiskFlag[]
  latest_event?: OrgEscrowLatestEvent | null
}

export type OrgEscrowAuditEventItem = {
  event_id: string
  escrow_id: string
  /** e.g. `"user:{id}"`, `"system"`, `"admin"`. */
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
  http_status: number | null
  attempt: number
  delivery_status: string
  error_message?: string | null
  created_at: string
  next_retry_at?: string | null
}

/**
 * Common envelope for org-escrow mutation responses (currently: cancel).
 *
 * NOTE: Creation is intentionally NOT exposed on this dashboard surface —
 * organizations create escrows via the API only — so there is no
 * `OrgEscrowCreateResponse`. Mirror the user-side EscrowResponse shape for
 * the fields we expect to read back.
 */
export type OrgEscrowMutationResponse = {
  id: string
  status: string
  amount?: number
  currency?: string
  escrow_type?: string
  title?: string
  org_id?: string
}

/** `POST /escrows/{escrow_id}/cancel` response shape. */
export type OrgEscrowCancelResponse = OrgEscrowMutationResponse & {
  refunded: boolean
}
