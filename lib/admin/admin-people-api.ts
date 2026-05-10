'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  AdminBanBody,
  AdminCreateRiskFlagBody,
  AdminKycCrossCheck,
  AdminKycQueueRow,
  AdminKycSubmissionReviewBody,
  AdminKycSubmissionRow,
  AdminKycUserReviewBody,
  AdminPaginatedEnvelope,
  AdminRiskFlagRow,
  AdminUserContext,
  AdminUserRow,
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

async function adminPostJson(
  accessToken: string,
  pathname: string,
  body: unknown,
): Promise<unknown> {
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

/** Optional directory filters forwarded as query params (`GET /api/v1/admin/users`). */
export type AdminUsersListFilters = {
  /** Free-text query; sent as `search` (omit when empty). */
  search?: string
  /** Exact role match (`role`). */
  role?: string
  /** KYC status (`kyc_status`). */
  kyc_status?: string
  /** When set, sends `banned=true` / `banned=false`. */
  banned?: boolean | null
  /** When set, sends `email_verified=true` / `email_verified=false`. */
  email_verified?: boolean | null
}

function appendAdminUsersFilters(qs: URLSearchParams, filters?: AdminUsersListFilters | null) {
  if (!filters) return
  const search = filters.search?.trim()
  if (search) {
    qs.set('search', search)
  }
  const role = filters.role?.trim()
  if (role) {
    qs.set('role', role)
  }
  const kyc = filters.kyc_status?.trim()
  if (kyc) {
    qs.set('kyc_status', kyc)
  }
  if (filters.banned === true) {
    qs.set('banned', 'true')
  }
  if (filters.banned === false) {
    qs.set('banned', 'false')
  }
  if (filters.email_verified === true) {
    qs.set('email_verified', 'true')
  }
  if (filters.email_verified === false) {
    qs.set('email_verified', 'false')
  }
}

export async function fetchAdminUsers(
  accessToken: string,
  page: number,
  pageSize: number,
  filters?: AdminUsersListFilters | null,
): Promise<AdminPaginatedEnvelope<AdminUserRow>> {
  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  appendAdminUsersFilters(qs, filters ?? undefined)
  return adminGetJson(accessToken, `/api/me/admin/users?${qs}`)
}

/** Scan directory pages until `user_id` is found or list ends (maxPages cap). */
export async function fetchAdminUserRowByScan(
  accessToken: string,
  userId: string,
  pageSize = 50,
  maxPages = 25,
): Promise<AdminUserRow | null> {
  for (let page = 1; page <= maxPages; page += 1) {
    const r = await fetchAdminUsers(accessToken, page, pageSize, null)
    const hit = r.items.find((u) => u.user_id === userId)
    if (hit) {
      return hit
    }
    if (r.items.length < pageSize) {
      return null
    }
  }
  return null
}

/** Best-effort single user row via directory search, then paging scan fallback. */
export async function fetchAdminUserSummaryById(
  accessToken: string,
  userId: string,
): Promise<AdminUserRow | null> {
  const id = typeof userId === 'string' ? userId.trim() : ''
  if (!id) {
    return null
  }
  try {
    const r = await fetchAdminUsers(accessToken, 1, 75, { search: id })
    const exact = r.items.find((u) => u.user_id === id)
    if (exact) {
      return exact
    }
  } catch {
    /* fall through */
  }
  return fetchAdminUserRowByScan(accessToken, id, 50, 25)
}

export async function fetchAdminUserContext(
  accessToken: string,
  userId: string,
): Promise<AdminUserContext> {
  const id = encodeURIComponent(userId)
  return adminGetJson(accessToken, `/api/me/admin/users/${id}/context`)
}

export async function postAdminBanUser(
  accessToken: string,
  userId: string,
  body: AdminBanBody,
): Promise<unknown> {
  const id = encodeURIComponent(userId)
  return adminPostJson(accessToken, `/api/me/admin/users/${id}/ban`, body)
}

export async function postAdminUnbanUser(
  accessToken: string,
  userId: string,
): Promise<unknown> {
  const id = encodeURIComponent(userId)
  return adminPostJson(accessToken, `/api/me/admin/users/${id}/unban`, {})
}

export async function postAdminResetUserRisk(accessToken: string, userId: string): Promise<unknown> {
  const id = encodeURIComponent(userId)
  return adminPostJson(accessToken, `/api/me/admin/users/${id}/risk/reset`, {})
}

export async function fetchAdminRiskFlags(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminRiskFlagRow>> {
  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  return adminGetJson(accessToken, `/api/me/admin/risk-flags?${qs}`)
}

export async function postAdminCreateRiskFlag(
  accessToken: string,
  body: AdminCreateRiskFlagBody,
): Promise<unknown> {
  return adminPostJson(accessToken, '/api/me/admin/risk-flags', body)
}

export async function fetchAdminKycReviewQueue(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminKycQueueRow>> {
  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  return adminGetJson(accessToken, `/api/me/admin/kyc/review-queue?${qs}`)
}

export async function postAdminKycUserReview(
  accessToken: string,
  userId: string,
  body: AdminKycUserReviewBody,
): Promise<unknown> {
  const id = encodeURIComponent(userId)
  return adminPostJson(accessToken, `/api/me/admin/kyc/${id}/review`, body)
}

export async function fetchAdminKycSubmissions(
  accessToken: string,
  page: number,
  pageSize: number,
  status?: string | null,
): Promise<AdminPaginatedEnvelope<AdminKycSubmissionRow>> {
  const qs = new URLSearchParams()
  if (page !== 1) qs.set('page', String(page))
  if (pageSize !== 20) qs.set('page_size', String(pageSize))
  if (status?.trim()) qs.set('status', status.trim())
  const q = qs.toString()
  return adminGetJson(accessToken, `/api/me/admin/kyc/submissions${q ? `?${q}` : ''}`)
}

export async function fetchAdminKycSubmission(
  accessToken: string,
  submissionId: string,
): Promise<AdminKycSubmissionRow> {
  const id = encodeURIComponent(submissionId)
  return adminGetJson(accessToken, `/api/me/admin/kyc/submissions/${id}`)
}

export async function postAdminKycSubmissionReview(
  accessToken: string,
  submissionId: string,
  body: AdminKycSubmissionReviewBody,
): Promise<unknown> {
  const id = encodeURIComponent(submissionId)
  return adminPostJson(accessToken, `/api/me/admin/kyc/submissions/${id}/review`, body)
}

export async function fetchAdminKycDocuments(
  accessToken: string,
  userId: string,
): Promise<unknown> {
  const id = encodeURIComponent(userId)
  return adminGetJson(accessToken, `/api/me/admin/kyc/${id}/documents`)
}

export async function fetchAdminKycCrossCheck(
  accessToken: string,
  userId: string,
): Promise<AdminKycCrossCheck> {
  const id = encodeURIComponent(userId)
  return adminGetJson(accessToken, `/api/me/admin/kyc/${id}/cross-check`)
}

export async function postAdminCreateModerator(
  accessToken: string,
  body: import('@/lib/admin/admin-api-types').AdminCreateModeratorBody,
): Promise<unknown> {
  return adminPostJson(accessToken, '/api/me/admin/moderators', body)
}
