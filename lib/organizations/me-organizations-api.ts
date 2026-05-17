'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  BusinessLicenseUploadResponse,
  MeInviteRow,
  MeInviteStatusFilter,
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
    email?: string
    phone_number?: string
    address?: string
    business_license_file_id: string
    commercial_registration_file_id: string
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
  if (
    !data ||
    typeof data !== 'object' ||
    typeof (data as OrgInviteDecisionResponse).decision !== 'string'
  ) {
    throw new Error('Unexpected invite decision response.')
  }
  return data as OrgInviteDecisionResponse
}

/**
 * `GET /api/v1/organizations/invites/me` — list invitations addressed to the
 * current user. Optional `status` filter narrows the result.
 */
export async function fetchMeInvites(
  accessToken: string,
  status?: MeInviteStatusFilter,
): Promise<MeInviteRow[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  const res = await fetch(`/api/me/organizations/invites/me${qs}`, {
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
    throw new Error('Unexpected invites response.')
  }
  return data as MeInviteRow[]
}

/**
 * `POST /api/v1/organizations/invites/me/{invite_id}/decision` — accept or
 * reject a single invitation addressed to the current user.
 */
export async function postMeInviteDecision(
  accessToken: string,
  inviteId: string,
  decision: 'accept' | 'reject',
): Promise<OrgInviteDecisionResponse> {
  const res = await fetch(
    `/api/me/organizations/invites/me/${encodeURIComponent(inviteId)}/decision`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ decision }),
      cache: 'no-store',
    },
  )
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (
    !data ||
    typeof data !== 'object' ||
    typeof (data as OrgInviteDecisionResponse).decision !== 'string'
  ) {
    throw new Error('Unexpected invite decision response.')
  }
  return data as OrgInviteDecisionResponse
}

export async function postOrganizationSubscribe(
  accessToken: string,
  orgId: string,
): Promise<{ payment_url: string; transaction_ref: string }> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/subscribe`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as any).payment_url !== 'string') {
    throw new Error('Unexpected subscribe response.')
  }
  return data as { payment_url: string; transaction_ref: string }
}

export async function postOrganizationSubscribeVerify(
  accessToken: string,
  orgId: string,
  transaction_ref: string,
): Promise<{ status: string; message: string }> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/subscribe/verify`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ transaction_ref }),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return data as { status: string; message: string }
}
