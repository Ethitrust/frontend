/**
 * API client functions for Risk Monitoring & Fraud Detection
 */

'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function authHeaders(accessToken: string, contentType?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }
  if (contentType) {
    h['Content-Type'] = contentType
  }
  return h
}

async function adminGetJson<T>(accessToken: string, pathname: string): Promise<T> {
  const res = await fetch(pathname.startsWith('/') ? pathname : `/${pathname}`, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return data as T
}

async function adminPostJson<T>(
  accessToken: string,
  pathname: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(pathname.startsWith('/') ? pathname : `/${pathname}`, {
    method: 'POST',
    headers: authHeaders(accessToken, 'application/json'),
    cache: 'no-store',
    body: JSON.stringify(body ?? {}),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return data as T
}

async function adminPutJson<T>(
  accessToken: string,
  pathname: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(pathname.startsWith('/') ? pathname : `/${pathname}`, {
    method: 'PUT',
    headers: authHeaders(accessToken, 'application/json'),
    cache: 'no-store',
    body: JSON.stringify(body ?? {}),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return data as T
}

// ==================== Types ====================

export interface UserRiskProfile {
  id: string
  user_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  
  // Seller metrics
  total_escrows_as_seller: number
  disputes_against_as_seller: number
  seller_dispute_rate: number
  seller_reputation_score: number
  
  // Buyer metrics
  total_escrows_as_buyer: number
  disputes_raised_as_buyer: number
  buyer_dispute_rate: number
  
  // Pattern metrics
  instant_confirmation_count: number
  repeated_partner_count: number
  dispute_near_deadline_count: number
  circular_flow_flags: number
  transaction_velocity: number
  avg_transaction_amount: number
  
  // Flags
  total_flags: number
  is_restricted: boolean
  restriction_reason?: string | null
  restricted_at?: string | null
  
  // Timestamps
  last_flag_date?: string | null
  last_dispute_date?: string | null
  last_calculated_at: string
  created_at: string
  updated_at: string
}

export interface EscrowRiskScore {
  id: string
  escrow_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: Record<string, number>
  
  is_flagged: boolean
  flagged_at?: string | null
  flag_reasons?: string[] | null
  
  requires_manual_review: boolean
  review_status?: 'pending' | 'approved' | 'rejected' | 'escalated' | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_notes?: string | null
  
  funds_held: boolean
  hold_until?: string | null
  hold_reason?: string | null
  
  calculated_at: string
  created_at: string
  updated_at: string
}

export interface RiskEvent {
  id: string
  user_id: string
  escrow_id?: string | null
  dispute_id?: string | null
  
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: Record<string, any> | null
  
  risk_score_impact: number
  action_taken?: string | null
  
  created_at: string
}

export interface AdminReviewQueueItem {
  id: string
  item_type: 'escrow' | 'user' | 'dispute' | 'transaction_pattern'
  item_id: string
  
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_review' | 'resolved' | 'escalated' | 'dismissed'
  title: string
  description: string
  risk_factors: string[]
  
  assigned_to?: string | null
  assigned_at?: string | null
  
  resolved_by?: string | null
  resolved_at?: string | null
  resolution_action?: string | null
  resolution_notes?: string | null
  
  metadata?: Record<string, any> | null
  
  created_at: string
  updated_at: string
}

export interface CircularFlowDetection {
  id: string
  flow_path: string[]
  cycle_length: number
  
  total_volume: number
  avg_transaction_amount: number
  transaction_count: number
  
  time_span_days: number
  avg_time_between_transactions: number
  
  risk_score: number
  risk_indicators: string[]
  
  status: 'detected' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved'
  investigated_by?: string | null
  investigation_notes?: string | null
  action_taken?: string | null
  
  first_transaction_at: string
  last_transaction_at: string
  detected_at: string
  resolved_at?: string | null
  
  created_at: string
  updated_at: string
}

export interface RiskStatistics {
  total_flagged_escrows: number
  total_restricted_users: number
  pending_reviews: number
  high_risk_users: number
  critical_risk_escrows: number
  
  circular_flows_detected: number
  circular_flows_confirmed: number
  
  avg_risk_score: number
  
  recent_events: RiskEvent[]
  top_risk_factors: Record<string, number>
}

export interface RiskConfig {
  instant_confirmation_threshold_minutes: number
  repeated_interaction_count_threshold: number
  seller_high_dispute_rate_threshold: number
  dispute_near_deadline_hours: number
  transaction_frequency_threshold: number
  high_risk_score_threshold: number
  critical_risk_score_threshold: number
}

// ==================== API Functions ====================

/**
 * Get risk monitoring statistics dashboard
 */
export async function fetchRiskStatistics(
  accessToken: string
): Promise<RiskStatistics> {
  return adminGetJson<RiskStatistics>(accessToken, '/api/me/admin/risk/statistics')
}

/**
 * Get user risk profile
 */
export async function fetchUserRiskProfile(
  accessToken: string,
  userId: string
): Promise<UserRiskProfile> {
  return adminGetJson<UserRiskProfile>(accessToken, `/api/me/admin/risk/users/${userId}/profile`)
}

/**
 * Recalculate user risk score
 */
export async function recalculateUserRisk(
  accessToken: string,
  userId: string
): Promise<{ user_id: string; risk_score: number; status: string }> {
  return adminPostJson(accessToken, `/api/me/admin/risk/users/${userId}/recalculate`, {})
}

/**
 * Restrict a user
 */
export async function restrictUser(
  accessToken: string,
  userId: string,
  reason: string,
  durationDays?: number
): Promise<UserRiskProfile> {
  return adminPostJson<UserRiskProfile>(
    accessToken,
    `/api/me/admin/risk/users/${userId}/restrict`,
    { reason, duration_days: durationDays }
  )
}

/**
 * Unrestrict a user
 */
export async function unrestrictUser(
  accessToken: string,
  userId: string,
  notes?: string
): Promise<UserRiskProfile> {
  return adminPostJson<UserRiskProfile>(
    accessToken,
    `/api/me/admin/risk/users/${userId}/unrestrict`,
    { notes }
  )
}

/**
 * Get escrow risk score
 */
export async function fetchEscrowRiskScore(
  accessToken: string,
  escrowId: string
): Promise<EscrowRiskScore> {
  return adminGetJson<EscrowRiskScore>(accessToken, `/api/me/admin/risk/escrows/${escrowId}/risk`)
}

/**
 * Review a flagged escrow
 */
export async function reviewFlaggedEscrow(
  accessToken: string,
  escrowId: string,
  adminId: string,
  action: 'approve' | 'reject' | 'escalate',
  notes?: string
): Promise<EscrowRiskScore> {
  return adminPostJson<EscrowRiskScore>(
    accessToken,
    `/api/me/admin/risk/escrows/${escrowId}/review?admin_id=${adminId}`,
    { action, notes }
  )
}

/**
 * Get review queue
 */
export async function fetchReviewQueue(
  accessToken: string,
  params?: {
    status?: string
    priority?: string
    item_type?: string
    page?: number
    page_size?: number
  }
): Promise<{
  items: AdminReviewQueueItem[]
  total: number
  page: number
  page_size: number
}> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.priority) searchParams.set('priority', params.priority)
  if (params?.item_type) searchParams.set('item_type', params.item_type)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.page_size) searchParams.set('page_size', params.page_size.toString())
  
  const query = searchParams.toString()
  const path = `/api/me/admin/risk/review-queue${query ? `?${query}` : ''}`
  
  return adminGetJson(accessToken, path)
}

/**
 * Assign review item to admin
 */
export async function assignReviewItem(
  accessToken: string,
  itemId: string,
  adminId: string
): Promise<{ status: string; item_id: string }> {
  return adminPostJson(
    accessToken,
    `/api/me/admin/risk/review-queue/${itemId}/assign`,
    { admin_id: adminId }
  )
}

/**
 * Resolve review item
 */
export async function resolveReviewItem(
  accessToken: string,
  itemId: string,
  adminId: string,
  action: string,
  notes?: string
): Promise<{ status: string; item_id: string }> {
  return adminPostJson(
    accessToken,
    `/api/me/admin/risk/review-queue/${itemId}/resolve?admin_id=${adminId}`,
    { action, notes }
  )
}

/**
 * Get circular flow detections
 */
export async function fetchCircularFlows(
  accessToken: string,
  params?: {
    status?: string
    page?: number
    page_size?: number
  }
): Promise<{
  detections: CircularFlowDetection[]
  total: number
  page: number
  page_size: number
}> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.page_size) searchParams.set('page_size', params.page_size.toString())
  
  const query = searchParams.toString()
  const path = `/api/me/admin/risk/circular-flows${query ? `?${query}` : ''}`
  
  return adminGetJson(accessToken, path)
}

/**
 * Investigate circular flow
 */
export async function investigateCircularFlow(
  accessToken: string,
  detectionId: string,
  adminId: string,
  notes: string,
  action: 'confirmed' | 'false_positive' | 'resolved'
): Promise<{ status: string; detection_id: string }> {
  return adminPostJson(
    accessToken,
    `/api/me/admin/risk/circular-flows/${detectionId}/investigate?admin_id=${adminId}`,
    { notes, action }
  )
}

/**
 * Get risk events
 */
export async function fetchRiskEvents(
  accessToken: string,
  params?: {
    user_id?: string
    event_type?: string
    severity?: string
    page?: number
    page_size?: number
  }
): Promise<{
  events: RiskEvent[]
  total: number
  page: number
  page_size: number
}> {
  const searchParams = new URLSearchParams()
  if (params?.user_id) searchParams.set('user_id', params.user_id)
  if (params?.event_type) searchParams.set('event_type', params.event_type)
  if (params?.severity) searchParams.set('severity', params.severity)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.page_size) searchParams.set('page_size', params.page_size.toString())
  
  const query = searchParams.toString()
  const path = `/api/me/admin/risk/events${query ? `?${query}` : ''}`
  
  return adminGetJson(accessToken, path)
}

/**
 * Get risk configuration
 */
export async function fetchRiskConfig(
  accessToken: string
): Promise<RiskConfig> {
  return adminGetJson<RiskConfig>(accessToken, '/api/me/admin/risk/config')
}

/**
 * Update risk configuration
 */
export async function updateRiskConfig(
  accessToken: string,
  config: Partial<RiskConfig>
): Promise<{ status: string; config: Partial<RiskConfig> }> {
  return adminPutJson(accessToken, '/api/me/admin/risk/config', { config })
}
