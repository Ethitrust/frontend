/** Shapes aligned with `docs/apidoc.md` disputes section */

export type PaginatedDisputes = {
  items: EscrowDisputeRow[]
  page: number
  page_size: number
  total: number
}

export type EscrowDisputeRow = {
  id: string
  escrow_id?: string | null
  raised_by?: string | null
  buyer_id?: string | null
  seller_id?: string | null
  reason?: string | null
  description?: string | null
  status?: string | null
  resolution_note?: string | null
  settlement_proposed_outcome?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  negotiation_started_at?: string | null
  negotiation_deadline_at?: string | null
  escalated_at?: string | null
  assigned_mediator_id?: string | null
  settlement_requested_by?: string | null
  settlement_confirmed_by?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type DisputeMessageReplyPreview = {
  message_id: string
  text: string
}

export type DisputeMessageRow = {
  id: string
  dispute_id?: string | null
  sender_id?: string | null
  reply_to_message_id?: string | null
  reply_to_message?: DisputeMessageReplyPreview | null
  message_type?: string | null
  message?: string | null
  created_at?: string | null
}

export type DisputeEvidenceRow = {
  id: string
  dispute_id?: string | null
  message_id?: string | null
  uploaded_by?: string | null
  object_key?: string | null
  file_url?: string | null
  file_type?: string | null
  description?: string | null
  is_tampered?: boolean | null
  tamper_metadata?: Record<string, unknown> | null
  created_at?: string | null
}

export type DisputeParticipantRow = {
  id: string
  dispute_id?: string | null
  user_id?: string | null
  role?: string | null
  created_at?: string | null
}

export type DisputeThreadResponse = {
  messages?: DisputeMessageRow[] | null
  evidence?: DisputeEvidenceRow[] | null
  participants?: DisputeParticipantRow[] | null
}

export type EvidenceUploadUrlResponse = {
  file_id: string
  object_key: string
  file_name: string
  content_type: string
}
