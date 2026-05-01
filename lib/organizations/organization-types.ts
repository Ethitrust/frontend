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

export type OrgInviteDecisionResponse = OrganizationRow

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
