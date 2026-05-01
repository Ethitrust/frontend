'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  DisputeEvidenceRow,
  DisputeMessageRow,
  DisputeThreadResponse,
  EscrowDisputeRow,
  EvidenceUploadUrlResponse,
  PaginatedDisputes,
} from '@/lib/disputes/dispute-types'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchMeDisputes(
  accessToken: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedDisputes> {
  const q = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  const res = await fetch(`/api/me/disputes?${q}`, {
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
  if (!data || typeof data !== 'object' || !Array.isArray((data as PaginatedDisputes).items)) {
    throw new Error('Unexpected disputes response.')
  }
  return data as PaginatedDisputes
}

export async function fetchMeDispute(
  accessToken: string,
  disputeId: string,
): Promise<EscrowDisputeRow> {
  const res = await fetch(`/api/me/disputes/${encodeURIComponent(disputeId)}`, {
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
  if (!data || typeof data !== 'object' || typeof (data as EscrowDisputeRow).id !== 'string') {
    throw new Error('Unexpected dispute response.')
  }
  return data as EscrowDisputeRow
}

export async function fetchMeDisputeThread(
  accessToken: string,
  disputeId: string,
): Promise<DisputeThreadResponse> {
  const res = await fetch(`/api/me/disputes/${encodeURIComponent(disputeId)}/thread`, {
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
  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected dispute thread response.')
  }
  return data as DisputeThreadResponse
}

export async function postDisputeCancel(
  accessToken: string,
  disputeId: string,
): Promise<EscrowDisputeRow> {
  const res = await fetch(`/api/me/disputes/${encodeURIComponent(disputeId)}/cancel`, {
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
  return data as EscrowDisputeRow
}

export async function postDisputeMessage(
  accessToken: string,
  disputeId: string,
  body: {
    message: string
    message_type?: string
    reply_to_message_id?: string | null
  },
): Promise<DisputeMessageRow> {
  const res = await fetch(`/api/me/disputes/${encodeURIComponent(disputeId)}/messages`, {
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
  return data as DisputeMessageRow
}

export async function postSettlementPropose(
  accessToken: string,
  disputeId: string,
  body: { resolution_outcome: string; note?: string | null },
): Promise<EscrowDisputeRow> {
  const res = await fetch(
    `/api/me/disputes/${encodeURIComponent(disputeId)}/settlement/propose`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return data as EscrowDisputeRow
}

export async function postSettlementConfirm(
  accessToken: string,
  disputeId: string,
  body: { note?: string | null },
): Promise<EscrowDisputeRow> {
  const res = await fetch(
    `/api/me/disputes/${encodeURIComponent(disputeId)}/settlement/confirm`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return data as EscrowDisputeRow
}

export async function postDisputeEvidence(
  accessToken: string,
  disputeId: string,
  body: {
    message_id?: string | null
    object_key: string
    file_url?: string | null
    file_type: string
    description?: string | null
  },
): Promise<DisputeEvidenceRow> {
  const res = await fetch(`/api/me/disputes/${encodeURIComponent(disputeId)}/evidence`, {
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
  return data as DisputeEvidenceRow
}

export async function postDisputeEvidenceUpload(
  accessToken: string,
  disputeId: string,
  formData: FormData,
): Promise<EvidenceUploadUrlResponse> {
  const res = await fetch(
    `/api/me/disputes/${encodeURIComponent(disputeId)}/evidence/upload-url`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
      cache: 'no-store',
    },
  )
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (
    !data ||
    typeof data !== 'object' ||
    typeof (data as EvidenceUploadUrlResponse).object_key !== 'string'
  ) {
    throw new Error('Unexpected upload response.')
  }
  return data as EvidenceUploadUrlResponse
}
