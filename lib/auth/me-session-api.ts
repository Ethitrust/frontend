'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type { AuthMeRow, AuthProfileRow } from '@/lib/auth/auth-session-types'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchAuthMe(accessToken: string): Promise<AuthMeRow> {
  const res = await fetch('/api/me/auth/me', {
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
  return data as AuthMeRow
}

export async function fetchAuthProfile(accessToken: string): Promise<AuthProfileRow> {
  const res = await fetch('/api/me/auth/profile', {
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
  const payload = data as { profile: AuthProfileRow }
  if (!payload || !payload.profile) {
    throw new Error('Unexpected profile response structure')
  }
  return payload.profile
}
