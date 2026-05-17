/** Shapes from `docs/apidoc.md` — organizations. */

export type OrganizationRow = {
  id: string
  name: string
  slug: string
  status: string
  created_at?: string | null
}

export type OrgApplicationRow = {
  id: string
  org_id: string | null | undefined
  applicant_user_id?: string | null
  tin?: string | null
  business_license_file_id?: string | null
  status: string
  submitted_at?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  rejection_reason?: string | null
}

export type OrgApplyResponse = {
  organization: OrganizationRow
  application: OrgApplicationRow
}

export type BusinessLicenseUploadResponse = {
  file_id: string
  object_key: string
  file_name: string
  content_type: string
}

/**
 * Response shape for accepting/declining an org invitation.
 * The backend confirms the decision and provides a human-readable message
 * (it does NOT return the organization row).
 */
export type OrgInviteDecisionResponse = {
  decision: 'accepted' | 'rejected' | string
  message: string
}

/**
 * Allowed values for the `status` filter on `GET /organizations/invites/me`.
 * `answered` is a server-side convenience meaning `accepted | rejected`.
 */
export type MeInviteStatusFilter =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'answered'

/**
 * Row shape returned by `GET /organizations/invites/me`. Mirrors the existing
 * pending-invite shape used by the org admin team view, plus org context.
 */
export type MeInviteRow = {
  id: string
  email: string
  role: string
  status: string
  /** ISO 8601. May be absent if the invite hasn't been issued an expiry. */
  expires_at?: string | null
  created_at?: string | null
  /** Org id that issued the invite. */
  org_id: string
  /** Pretty name of the issuing org, when the server includes it. */
  org_name?: string | null
  org_slug?: string | null
  /** Display name of who sent the invite, when available. */
  invited_by?: string | null
}

/** GET/PATCH `/api/v1/organizations/{org_id}/profile` */

export type OrganizationProfileRow = {
  id: string
  org_id: string
  name: string
  slug: string
  logo: string
  email: string
  phone_number: string
  address: string
  tin: string
  kyb_status: string
  is_flagged: boolean
  risk_score: number
  webhook_url: string
  webhook_secret: string
  created_at: string
  updated_at: string
}

/** GET `/api/v1/organizations/{org_id}/api-keys` */
export type OrgApiKeyRow = {
  id: string
  org_id: string
  key_name: string
  is_active: boolean
  created_at: string
}

/** POST create — `api_key` only once on create */
export type OrgApiKeyCreateResponse = OrgApiKeyRow & {
  api_key?: string | null
}
