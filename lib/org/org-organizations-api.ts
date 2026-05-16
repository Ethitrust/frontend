'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  OrganizationProfileRow,
  OrgApiKeyCreateResponse,
  OrgApiKeyRow,
} from '@/lib/organizations/organization-types'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchOrgProfile(accessToken: string, orgId: string): Promise<OrganizationProfileRow> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/profile`, {
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
  if (!data || typeof data !== 'object' || typeof (data as OrganizationProfileRow).org_id !== 'string') {
    throw new Error('Unexpected organization profile response.')
  }
  return data as OrganizationProfileRow
}

export async function patchOrgProfile(
  accessToken: string,
  orgId: string,
  body: unknown,
): Promise<OrganizationProfileRow> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/profile`, {
    method: 'PATCH',
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
  if (!data || typeof data !== 'object' || typeof (data as OrganizationProfileRow).org_id !== 'string') {
    throw new Error('Unexpected PATCH profile response.')
  }
  return data as OrganizationProfileRow
}

export async function fetchOrgApiKeys(accessToken: string, orgId: string): Promise<OrgApiKeyRow[]> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/api-keys`, {
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
    throw new Error('Unexpected API keys response.')
  }
  return data as OrgApiKeyRow[]
}

export async function postOrgApiKey(
  accessToken: string,
  orgId: string,
  keyName: string,
): Promise<OrgApiKeyCreateResponse> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/api-keys`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ key_name: keyName }),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as OrgApiKeyCreateResponse).id !== 'string') {
    throw new Error('Unexpected create API key response.')
  }
  return data as OrgApiKeyCreateResponse
}

export async function deleteOrgApiKey(accessToken: string, orgId: string, apiKeyId: string): Promise<void> {
  const res = await fetch(
    `/api/me/organizations/${encodeURIComponent(orgId)}/api-keys/${encodeURIComponent(apiKeyId)}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    },
  )
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
}

export async function fetchOrgMembers(accessToken: string, orgId: string): Promise<any[]> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/members`, {
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
  return data as any[]
}

export async function fetchOrgInvites(accessToken: string, orgId: string): Promise<any[]> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/invites`, {
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
  return data as any[]
}

export async function postOrgInvite(accessToken: string, orgId: string, payload: { email: string, role: string }): Promise<any> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/invite-member`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return data
}

export async function deleteOrgMember(accessToken: string, orgId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
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
}

export async function pauseOrgMember(accessToken: string, orgId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}/pause`, {
    method: 'POST',
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
}

export async function resumeOrgMember(accessToken: string, orgId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}/resume`, {
    method: 'POST',
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
}

export async function cancelOrgInvite(accessToken: string, orgId: string, inviteId: string): Promise<void> {
  const res = await fetch(`/api/me/organizations/${encodeURIComponent(orgId)}/invites/${encodeURIComponent(inviteId)}`, {
    method: 'DELETE',
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
}
