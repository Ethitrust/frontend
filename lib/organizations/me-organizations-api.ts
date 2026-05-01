'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  BusinessLicenseUploadResponse,
  OrgApplyResponse,
  OrganizationRow,
  OrgInviteDecisionResponse,
} from '@/lib/organizations/organization-types'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchMeOrganizations(accessToken: string): Promise<OrganizationRow[]> {
  const res = await fetch('/api/me/organizations', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!Array.isArray(data)) {
    throw new Error('Unexpected organizations response.')
  }
  return data as OrganizationRow[]
}

export async function postOrganizationApply(
  accessToken: string,
  body: {
    name: string
    slug: string
    tin: string
    business_license_file_id: string
  },
): Promise<OrgApplyResponse> {
  const res = await fetch('/api/me/organizations/apply', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (
    !data ||
    typeof data !== 'object' ||
    !(data as OrgApplyResponse).organization ||
    !(data as OrgApplyResponse).application
  ) {
    throw new Error('Unexpected apply response.')
  }
  return data as OrgApplyResponse
}

export async function postBusinessLicenseUploadUrl(
  accessToken: string,
  formData: FormData,
): Promise<BusinessLicenseUploadResponse> {
  const res = await fetch('/api/me/organizations/applications/business-license/upload-url', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (
    !data ||
    typeof data !== 'object' ||
    typeof (data as BusinessLicenseUploadResponse).file_id !== 'string'
  ) {
    throw new Error('Unexpected license upload response.')
  }
  return data as BusinessLicenseUploadResponse
}

export async function postOrgInviteDecision(
  accessToken: string,
  orgId: string,
  body: { invitation_token: string; decision: 'accept' | 'reject' },
): Promise<OrgInviteDecisionResponse> {
  const res = await fetch(
    `/api/me/organizations/${encodeURIComponent(orgId)}/invite-member/decision`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as OrganizationRow).id !== 'string') {
    throw new Error('Unexpected invite decision response.')
  }
  return data as OrgInviteDecisionResponse
}
