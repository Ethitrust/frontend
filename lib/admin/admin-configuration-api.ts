'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  AdminPaginatedEnvelope,
  AdminPlatformSettingPatchBody,
  AdminPlatformSettingRow,
  AdminSupportCaseCreateBody,
  AdminSupportCaseListRow,
  AdminSupportCasePatchBody,
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

async function adminPatchJson(accessToken: string, pathname: string, body: unknown): Promise<unknown> {
  const res = await fetch(pathname.startsWith('/') ? pathname : `/${pathname}`, {
    method: 'PATCH',
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

function listQs(page: number, pageSize: number, extra?: Record<string, string>): string {
  const p = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      const t = v.trim()
      if (t) p.set(k, t)
    }
  }
  return p.toString()
}

export async function fetchAdminSupportCaseList(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminSupportCaseListRow>> {
  return adminGetJson(accessToken, `/api/me/admin/support-cases?${listQs(page, pageSize)}`)
}

export async function postAdminSupportCase(
  accessToken: string,
  body: AdminSupportCaseCreateBody,
): Promise<unknown> {
  return adminPostJson(accessToken, '/api/me/admin/support-cases', body)
}

export async function patchAdminSupportCase(
  accessToken: string,
  caseId: string,
  body: AdminSupportCasePatchBody,
): Promise<unknown> {
  const id = encodeURIComponent(caseId)
  return adminPatchJson(accessToken, `/api/me/admin/support-cases/${id}`, body)
}

export async function fetchAdminPlatformSettingList(
  accessToken: string,
  page: number,
  pageSize: number,
  category?: string,
): Promise<AdminPaginatedEnvelope<AdminPlatformSettingRow>> {
  const qs = listQs(page, pageSize, category ? { category } : undefined)
  return adminGetJson(accessToken, `/api/me/admin/settings?${qs}`)
}

export async function fetchAdminPlatformSetting(
  accessToken: string,
  key: string,
): Promise<AdminPlatformSettingRow> {
  const k = encodeURIComponent(key)
  return adminGetJson<AdminPlatformSettingRow>(accessToken, `/api/me/admin/settings/${k}`)
}

export async function patchAdminPlatformSetting(
  accessToken: string,
  key: string,
  body: AdminPlatformSettingPatchBody,
): Promise<unknown> {
  const k = encodeURIComponent(key)
  return adminPatchJson(accessToken, `/api/me/admin/settings/${k}`, body)
}
