/** Shapes from `docs/admin-apidoc.md` (operator API). */

export type AdminPipelineDiagnostics = {
  failed_events: number;
  failed_deliveries: number;
  pending_deliveries: number;
};

export type AdminFeeReconcileRow = {
  currency: string;
  collected_amount: number;
  refunded_amount: number;
};

export type AdminListMeta = {
  page: number;
  page_size: number;
  total: number;
};

/** Paginated list envelope from admin list endpoints */
export type AdminPaginatedEnvelope<T = unknown> = {
  meta: AdminListMeta;
  items: T[];
};

/** `GET /api/v1/admin/users` row (`docs/admin-apidoc.md`) */
export type AdminUserRow = {
  user_id: string;
  name: string | null;
  email: string;
  role?: string | null;
  email_verified?: boolean;
  kyc_status?: string | null;
  two_factor_enabled?: boolean;
  banned?: boolean;
  ban_reason?: string | null;
  ban_expires?: string | null;
  created_at?: string | null;
  last_active_session?: string | null;
  org_membership_count?: number;
  invitation_count?: number;
  admin_actions?: string[];
};

/** `GET /api/v1/admin/kyc/review-queue` row */
export type AdminKycQueueRow = {
  user_id: string;
  fan?: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  verification_status?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  document_object_keys?: string[];
  metadata?: Record<string, unknown>;
  admin_actions?: string[];
};

/** Manual KYC submission (`GET …/kyc/submissions`) */
export type AdminKycSubmissionRow = {
  submission_id: string;
  user_id: string;
  full_name?: string | null;
  id_number?: string | null;
  id_type?: string | null;
  front_id_url?: string | null;
  back_id_url?: string | null;
  selfie_url?: string | null;
  status?: string | null;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  submitted_at?: string | null;
};

/** `GET /api/v1/admin/risk-flags` row */
export type AdminRiskFlagRow = {
  risk_flag_id: string;
  subject_type: string;
  subject_id: string;
  risk_score: number;
  suspicious_activity_flags: string[];
  manual_review_reason?: string | null;
  case_status?: string | null;
  reviewed_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminUserContext = {
  sessions: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
  memberships: Record<string, unknown>[];
  invitations: Record<string, unknown>[];
};

export type AdminBanBody = {
  reason: string;
  expires_at?: string | null;
};

export type AdminKycUserReviewBody = {
  action: string;
  note?: string | null;
};

export type AdminKycSubmissionReviewBody = {
  action: string;
  rejection_reason?: string | null;
};

export type AdminCreateRiskFlagBody = {
  subject_type: string;
  subject_id: string;
  risk_score: number;
  suspicious_activity_flags: string[];
  manual_review_reason?: string | null;
  case_status?: string | null;
};

export type AdminKycCrossCheck = {
  user_id: string;
  user_email?: string | null;
  kyc_email?: string | null;
  user_name?: string | null;
  kyc_full_name?: string | null;
  kyc_phone?: string | null;
  kyc_status?: string | null;
};

/** `POST /api/v1/admin/moderators` request body */
export type AdminCreateModeratorBody = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  password: string;
};

/** `POST /api/v1/admin/moderators` response */
export type AdminModeratorRow = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  role: string;
  banned: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
};

/** `GET …/organizations/applications` list row */
export type AdminOrgApplicationRow = {
  application_id: string;
  org_id?: string | null;
  org_name?: string | null;
  applicant_user_id: string;
  status?: string | null;
  tin?: string | null;
  business_license_file_id?: string | null;
  business_license_object_key?: string | null;
  commercial_registration_file_id?: string | null;
  commercial_registration_object_key?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  admin_actions?: string[];
};

/** `GET …/applications/{application_id}` detail (+ URLs) */
export type AdminOrgApplicationDetail = AdminOrgApplicationRow & {
  business_license_url?: string | null;
  commercial_registration_url?: string | null;
};

export type AdminOrgApplicationReviewBody = {
  action: string;
  note?: string | null;
  skip_payment?: boolean;
};

export type AdminOrgSuspendBody = {
  reason: string;
};

/** `GET …/admin/escrows` list row */
export type AdminEscrowListRow = {
  escrow_id: string;
  title?: string | null;
  escrow_type?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  initiator_id?: string | null;
  receiver_id?: string | null;
  organization_id?: string | null;
  counter_status?: string | null;
  fee_amount?: number | null;
  delivery_date?: string | null;
  dispute_window_hours?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  timeline_event_count?: number;
  milestone_count?: number;
  counter_offer_count?: number;
  admin_actions?: string[];
};

/** `GET …/admin/disputes` list row */
export type AdminDisputeListRow = {
  dispute_id: string;
  escrow_id?: string | null;
  status?: string | null;
  reason?: string | null;
  raised_by?: string | null;
  buyer_id?: string | null;
  seller_id?: string | null;
  assigned_mediator_id?: string | null;
  negotiation_deadline_at?: string | null;
  escalated_at?: string | null;
  evidence_count?: number;
  message_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
  admin_actions?: string[];
};

/** `GET …/admin/wallets` row */
export type AdminWalletRow = {
  wallet_id: string;
  owner_id: string;
  currency?: string | null;
  balance?: number | null;
  locked_balance?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  admin_actions?: string[];
};

/** `GET …/admin/transactions` row */
export type AdminTransactionRow = {
  transaction_id: string;
  wallet_id?: string | null;
  escrow_id?: string | null;
  /** When present, prefer for user display (some upstream envelopes). */
  user_id?: string | null;
  owner_id?: string | null;
  transaction_type?: string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  reference?: string | null;
  provider?: string | null;
  created_at?: string | null;
  admin_actions?: string[];
};

/** `GET …/admin/wallet-locks` row */
export type AdminWalletLockRow = {
  lock_id: string;
  wallet_id: string;
  amount?: number | null;
  reason?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  status?: string | null;
  reference?: string | null;
  created_at?: string | null;
  released_at?: string | null;
  admin_actions?: string[];
};

/** `GET …/admin/fees` row */
export type AdminFeeRow = {
  fee_id: string;
  escrow_id?: string | null;
  org_id?: string | null;
  fee_type?: string | null;
  amount?: number | null;
  currency?: string | null;
  paid_by?: string | null;
  status?: string | null;
  created_at?: string | null;
  admin_actions?: string[];
};

export type AdminEscrowRelated = {
  escrow_id: string;
  users?: string[];
  wallet_ids?: string[];
  dispute_ids?: string[];
  fee_ids?: string[];
};

export type AdminEscrowFlagBody = {
  risk_score: number;
  manual_review_reason?: string | null;
  suspicious_activity_flags: string[];
};

export type AdminEscrowActionBody = {
  action: string;
  reason: string;
};

export type AdminDisputeAssignMediatorBody = {
  mediator_user_id: string;
};

export type AdminDisputeResolutionNoteBody = {
  note: string;
};

export type AdminDisputeActionBody = {
  action: string;
  note?: string | null;
  /** For partial settlements: amount to release to seller (in cents). */
  seller_amount_cents?: number | null;
};

export type AdminDisputeEvidenceTamperBody = {
  is_tampered: boolean;
  metadata?: Record<string, unknown>;
};

/** `GET …/admin/events` row */
export type AdminDomainEventListRow = {
  event_id: string;
  event_key?: string | null;
  event_type?: string | null;
  aggregate_type?: string | null;
  aggregate_id?: string | null;
  status?: string | null;
  attempt_count?: number | null;
  occurred_at?: string | null;
  failed_at?: string | null;
  last_error?: string | null;
  admin_actions?: string[];
};

/** `GET …/admin/notification-deliveries` row */
export type AdminNotificationDeliveryRow = {
  delivery_id: string;
  notification_id?: string | null;
  channel?: string | null;
  status?: string | null;
  retry_count?: number | null;
  next_retry_at?: string | null;
  last_error?: string | null;
  sent_at?: string | null;
  admin_actions?: string[];
};

/** `GET …/admin/audit-logs` row */
export type AdminAuditLogRow = {
  audit_id: string;
  actor_user_id?: string | null;
  action?: string | null;
  target_object_type?: string | null;
  target_object_id?: string | null;
  reason?: string | null;
  source_ip?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
};

export type AdminNotificationDeliveryRetryBody = {
  reason: string;
};

/** `GET /api/v1/admin/support-cases` row (`docs/admin-apidoc.md`) */
export type AdminSupportCaseListRow = {
  case_id: string;
  related_user_id?: string | null;
  related_escrow_id?: string | null;
  related_dispute_id?: string | null;
  priority?: string | null;
  status?: string | null;
  assignee_user_id?: string | null;
  sla_due_at?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminSupportCaseCreateBody = {
  related_user_id?: string | null;
  related_escrow_id?: string | null;
  related_dispute_id?: string | null;
  priority: string;
  status: string;
  assignee_user_id?: string | null;
  sla_due_at?: string | null;
  notes?: string | null;
};

export type AdminSupportCasePatchBody = {
  priority?: string;
  status?: string;
  assignee_user_id?: string | null;
  sla_due_at?: string | null;
  notes?: string | null;
};

/** `GET /api/v1/admin/settings` row */
export type AdminPlatformSettingRow = {
  key: string;
  category?: string | null;
  value_type?: string | null;
  value?: string | null;
  description?: string | null;
  is_runtime_enforced?: boolean;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminPlatformSettingPatchBody = {
  value: string;
  reason?: string | null;
};
