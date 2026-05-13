'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type { EscrowRow, MilestoneRow, PaginatedEscrowsList, EscrowEventRow, EscrowMessageRow, EscrowAdjustmentRow } from '@/lib/escrows/escrow-list-types'


export async function fetchMeEscrowAdjustments(
  accessToken: string,
  escrowId: string,
): Promise<EscrowAdjustmentRow[]> {
  const res = await fetch(`/api/me/escrows/${encodeURIComponent(escrowId)}/adjustments`, {
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
    throw new Error('Unexpected adjustments response.')
  }
  return data as EscrowAdjustmentRow[]
}

export async function postProposeAdjustment(
  accessToken: string,
  escrowId: string,
  payload: {
    adjustment_type: string
    proposed_amount?: number
    new_delivery_date?: string
    note?: string
  },
): Promise<EscrowAdjustmentRow> {
  const res = await fetch(`/api/me/escrows/${encodeURIComponent(escrowId)}/adjustments`, {
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
  if (!data || typeof data !== 'object' || typeof (data as EscrowAdjustmentRow).id !== 'string') {
    throw new Error('Unexpected proposal response.')
  }
  return data as EscrowAdjustmentRow
}

export async function postRespondToAdjustment(
  accessToken: string,
  adjustmentId: string,
  action: 'accept' | 'reject',
): Promise<EscrowAdjustmentRow> {
  const res = await fetch(`/api/me/escrows/adjustments/${encodeURIComponent(adjustmentId)}/respond`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action }),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as EscrowAdjustmentRow).id !== 'string') {
    throw new Error('Unexpected respond response.')
  }
  return data as EscrowAdjustmentRow
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchMeEscrows(
  accessToken: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedEscrowsList> {
  const q = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  const res = await fetch(`/api/me/escrows?${q}`, {
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
  if (!data || typeof data !== 'object' || !Array.isArray((data as PaginatedEscrowsList).items)) {
    throw new Error('Unexpected escrows list response.')
  }
  const row = data as PaginatedEscrowsList
  return {
    items: row.items,
    page: typeof row.page === 'number' ? row.page : page,
    page_size: typeof row.page_size === 'number' ? row.page_size : pageSize,
    total: typeof row.total === 'number' ? row.total : row.items.length,
  }
}

export async function fetchMeEscrow(accessToken: string, escrowId: string): Promise<EscrowRow> {
  const res = await fetch(`/api/me/escrows/${encodeURIComponent(escrowId)}`, {
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
  if (!data || typeof data !== 'object' || typeof (data as EscrowRow).id !== 'string') {
    throw new Error('Unexpected escrow response.')
  }
  return data as EscrowRow
}

export async function fetchMeEscrowMilestones(
  accessToken: string,
  escrowId: string,
): Promise<MilestoneRow[]> {
  const res = await fetch(`/api/me/escrows/${encodeURIComponent(escrowId)}/milestones`, {
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
    throw new Error('Unexpected milestones response.')
  }
  return data as MilestoneRow[]
}

export async function fetchMeEscrowEvents(
  accessToken: string,
  escrowId: string,
): Promise<EscrowEventRow[]> {
  const res = await fetch(`/api/me/escrows/${encodeURIComponent(escrowId)}/events`, {
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
    throw new Error('Unexpected events response.')
  }
  return data as EscrowEventRow[]
}

export async function fetchMeEscrowMessages(
  accessToken: string,
  escrowId: string,
): Promise<EscrowMessageRow[]> {
  const res = await fetch(`/api/me/escrows/${encodeURIComponent(escrowId)}/messages`, {
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
    throw new Error('Unexpected messages response.')
  }
  return data as EscrowMessageRow[]
}

export async function postMeEscrowMessage(
  accessToken: string,
  escrowId: string,
  message: string,
): Promise<EscrowMessageRow> {
  const res = await fetch(`/api/me/escrows/${encodeURIComponent(escrowId)}/messages`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as EscrowMessageRow).id !== 'string') {
    throw new Error('Unexpected send message response.')
  }
  return data as EscrowMessageRow
}

export async function postInitializeEscrow(accessToken: string, body: unknown): Promise<EscrowRow> {
  const res = await fetch('/api/me/escrows', {
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
  if (!data || typeof data !== 'object' || typeof (data as EscrowRow).id !== 'string') {
    throw new Error('Unexpected create escrow response.')
  }
  return data as EscrowRow
}

export type EscrowAction =
  | 'accept'
  | 'reject'
  | 'resend'
  | 'cancel'
  | 'submit'
  | 'complete'
  | 'review'
  | 'dispute'
  | 'counter'

export async function postMeEscrowAction(
  accessToken: string,
  escrowId: string,
  action: EscrowAction,
  payload?: unknown,
): Promise<EscrowRow> {
  const res = await fetch(`/api/me/escrows/${encodeURIComponent(escrowId)}/action`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action, payload }),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as EscrowRow).id !== 'string') {
    throw new Error('Unexpected escrow action response.')
  }
  return data as EscrowRow
}

export async function postMeMilestoneAction(
  accessToken: string,
  escrowId: string,
  milestoneId: string,
  action: 'deliver' | 'approve',
): Promise<MilestoneRow> {
  const res = await fetch(
    `/api/me/escrows/${encodeURIComponent(escrowId)}/milestones/${encodeURIComponent(
      milestoneId,
    )}/action`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action }),
      cache: 'no-store',
    },
  )
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as MilestoneRow).id !== 'string') {
    throw new Error('Unexpected milestone action response.')
  }
  return data as MilestoneRow
}
