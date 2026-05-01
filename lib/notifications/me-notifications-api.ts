'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type { PaginatedNotifications } from '@/lib/notifications/notification-types'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchMeNotifications(
  accessToken: string,
  opts?: { page?: number; pageSize?: number; unreadOnly?: boolean },
): Promise<PaginatedNotifications> {
  const q = new URLSearchParams({
    page: String(opts?.page ?? 1),
    page_size: String(opts?.pageSize ?? 20),
    unread_only: String(opts?.unreadOnly ?? false),
  })
  const res = await fetch(`/api/me/notifications?${q}`, {
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
  if (!data || typeof data !== 'object' || !Array.isArray((data as PaginatedNotifications).items)) {
    throw new Error('Unexpected notifications response.')
  }
  const row = data as PaginatedNotifications
  return {
    items: row.items,
    page: typeof row.page === 'number' ? row.page : opts?.page ?? 1,
    page_size:
      typeof row.page_size === 'number' ? row.page_size : opts?.pageSize ?? 20,
    total: typeof row.total === 'number' ? row.total : row.items.length,
    unread_count: typeof row.unread_count === 'number' ? row.unread_count : 0,
  }
}

export async function postMarkNotificationsRead(
  accessToken: string,
  notificationIds: string[],
): Promise<void> {
  const res = await fetch('/api/me/notifications/mark-read', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ notification_ids: notificationIds }),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
}

export async function postMarkAllNotificationsRead(accessToken: string): Promise<void> {
  const res = await fetch('/api/me/notifications/mark-all-read', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: '{}',
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
}
