'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  AdminDomainEventListRow,
  AdminNotificationDeliveryRetryBody,
  AdminNotificationDeliveryRow,
  AdminAuditLogRow,
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

function listQs(page: number, pageSize: number): string {
  return new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  }).toString()
}

export async function fetchAdminDomainEvents(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminDomainEventListRow>> {
  return adminGetJson(accessToken, `/api/me/admin/events?${listQs(page, pageSize)}`)
}

export async function fetchAdminEventPayload(
  accessToken: string,
  eventId: string,
): Promise<unknown> {
  const id = encodeURIComponent(eventId)
  return adminGetJson<unknown>(accessToken, `/api/me/admin/events/${id}/payload`)
}

export async function fetchAdminNotificationDeliveries(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminNotificationDeliveryRow>> {
  return adminGetJson(
    accessToken,
    `/api/me/admin/notification-deliveries?${listQs(page, pageSize)}`,
  )
}

export async function postAdminNotificationDeliveryRetry(
  accessToken: string,
  deliveryId: string,
  body: AdminNotificationDeliveryRetryBody,
): Promise<unknown> {
  const id = encodeURIComponent(deliveryId)
  return adminPostJson(accessToken, `/api/me/admin/notification-deliveries/${id}/retry`, body)
}

export async function fetchAdminAuditLogs(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminAuditLogRow>> {
  return adminGetJson(accessToken, `/api/me/admin/audit-logs?${listQs(page, pageSize)}`)
}
