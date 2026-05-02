'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  AdminOrgApplicationDetail,
  AdminOrgApplicationReviewBody,
  AdminOrgApplicationRow,
  AdminOrgSuspendBody,
  AdminPaginatedEnvelope,
} from '@/lib/admin/admin-api-types'

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

async function adminPostJson(accessToken: string, pathname: string, body: unknown): Promise<unknown> {
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
  return data
}

export async function fetchAdminOrgApplications(
  accessToken: string,
  page: number,
  pageSize: number,
  status?: string | null,
): Promise<AdminPaginatedEnvelope<AdminOrgApplicationRow>> {
  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  if (status?.trim()) {
    qs.set('status', status.trim())
  }
  return adminGetJson(accessToken, `/api/me/admin/organizations/applications?${qs}`)
}

export async function fetchAdminOrgApplication(
  accessToken: string,
  applicationId: string,
): Promise<AdminOrgApplicationDetail> {
  const id = encodeURIComponent(applicationId)
  return adminGetJson(accessToken, `/api/me/admin/organizations/applications/${id}`)
}

export async function postAdminOrgApplicationReview(
  accessToken: string,
  applicationId: string,
  body: AdminOrgApplicationReviewBody,
): Promise<unknown> {
  const id = encodeURIComponent(applicationId)
  return adminPostJson(accessToken, `/api/me/admin/organizations/applications/${id}/review`, body)
}

export async function postAdminOrgSuspend(
  accessToken: string,
  orgId: string,
  body: AdminOrgSuspendBody,
): Promise<unknown> {
  const id = encodeURIComponent(orgId)
  return adminPostJson(accessToken, `/api/me/admin/organizations/${id}/suspend`, body)
}

export async function postAdminOrgUnsuspend(
  accessToken: string,
  orgId: string,
  body: AdminOrgSuspendBody,
): Promise<unknown> {
  const id = encodeURIComponent(orgId)
  return adminPostJson(accessToken, `/api/me/admin/organizations/${id}/unsuspend`, body)
}
