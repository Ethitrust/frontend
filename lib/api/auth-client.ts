'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

/** POST JSON to a same-origin auth route handler; thrown Error uses BFF/upstream messaging. */
export async function authPostJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return data as T
}
