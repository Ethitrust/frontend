'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export type ManualKycSubmissionStatus = {
  submission_id: string
  status: string
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  front_id_url: string | null
  back_id_url: string | null
  selfie_url: string | null
}

export async function fetchManualKycSubmissionStatus(
  accessToken: string,
): Promise<ManualKycSubmissionStatus | null> {
  const res = await fetch('/api/me/kyc/submissions', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as ManualKycSubmissionStatus).status !== 'string') {
    throw new Error('Unexpected KYC status response.')
  }
  return data as ManualKycSubmissionStatus
}

/** Multipart manual KYC → BFF `POST /api/me/kyc/submissions` → `POST /api/v1/kyc/submit` (OpenAPI). */
export async function postManualKycSubmission(
  accessToken: string,
  formData: FormData,
): Promise<ManualKycSubmissionStatus> {
  const res = await fetch('/api/me/kyc/submissions', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  if (!data || typeof data !== 'object' || typeof (data as ManualKycSubmissionStatus).status !== 'string') {
    throw new Error('Unexpected KYC submission response.')
  }
  return data as ManualKycSubmissionStatus
}

export type FaydaActionResponse = {
  task_id: string
  status: string
  message: string
}

export type FaydaTaskStatusResponse = {
  task_id: string
  status: string
  result: Record<string, unknown> | null
  error: string | null
}

function assertFaydaActionResponse(data: unknown): FaydaActionResponse {
  if (!data || typeof data !== 'object' || typeof (data as FaydaActionResponse).task_id !== 'string') {
    throw new Error('Unexpected Fayda response.')
  }
  return data as FaydaActionResponse
}

export async function postFaydaSendOtp(
  accessToken: string,
  fanOrFin: string,
): Promise<FaydaActionResponse> {
  const res = await fetch('/api/me/kyc/fayda/send-otp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fan_or_fin: fanOrFin }),
    cache: 'no-store',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
  return assertFaydaActionResponse(data)
}

export async function postFaydaVerifyOtp(
  accessToken: string,
  payload: { fan_or_fin: string; transaction_id: string; otp: string },
): Promise<FaydaActionResponse> {
  const res = await fetch('/api/me/kyc/fayda/verify-otp', {
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
  return assertFaydaActionResponse(data)
}

export async function fetchFaydaTaskStatus(
  accessToken: string,
  taskId: string,
): Promise<FaydaTaskStatusResponse> {
  const res = await fetch(`/api/me/kyc/fayda/tasks/${encodeURIComponent(taskId)}`, {
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
  if (!data || typeof data !== 'object' || typeof (data as FaydaTaskStatusResponse).status !== 'string') {
    throw new Error('Unexpected Fayda task response.')
  }
  return data as FaydaTaskStatusResponse
}

export function extractFaydaTransactionId(result: Record<string, unknown> | null | undefined): string | null {
  if (!result) return null
  const candidates = ['transactionId', 'transaction_id', 'transactionID', 'txnId']
  for (const key of candidates) {
    const value = result[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}
