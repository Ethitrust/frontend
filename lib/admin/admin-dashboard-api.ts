'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  AdminFeeReconcileRow,
  AdminPaginatedEnvelope,
  AdminPipelineDiagnostics,
} from '@/lib/admin/admin-api-types'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function adminGetJson<T>(
  accessToken: string,
  pathname: string,
): Promise<T> {
  const res = await fetch(pathname.startsWith('/') ? pathname : `/${pathname}`, {
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
  return data as T
}

export async function fetchAdminPipelineDiagnostics(
  accessToken: string,
): Promise<AdminPipelineDiagnostics> {
  return adminGetJson(accessToken, '/api/me/admin/notifications/pipeline-diagnostics')
}

export async function fetchAdminFeesReconcile(
  accessToken: string,
): Promise<AdminFeeReconcileRow[]> {
  return adminGetJson(accessToken, '/api/me/admin/fees/reconcile')
}

async function fetchAdminListFirstPage(accessToken: string, segment: string) {
  return adminGetJson<AdminPaginatedEnvelope>(
    accessToken,
    `/api/me/admin/${segment}?page=1&page_size=1`,
  )
}

export async function fetchAdminEscrowTotal(accessToken: string): Promise<number> {
  const r = await fetchAdminListFirstPage(accessToken, 'escrows')
  return r.meta?.total ?? 0
}

export async function fetchAdminDisputeTotal(accessToken: string): Promise<number> {
  const r = await fetchAdminListFirstPage(accessToken, 'disputes')
  return r.meta?.total ?? 0
}

export async function fetchAdminUserTotal(accessToken: string): Promise<number> {
  const r = await fetchAdminListFirstPage(accessToken, 'users')
  return r.meta?.total ?? 0
}

export async function fetchAdminRiskFlagTotal(accessToken: string): Promise<number> {
  const r = await fetchAdminListFirstPage(accessToken, 'risk-flags')
  return r.meta?.total ?? 0
}
