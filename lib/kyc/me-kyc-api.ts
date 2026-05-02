'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/** Multipart manual KYC → BFF `POST /api/me/kyc/submissions` → `POST /api/v1/kyc/submit` (OpenAPI). */
export async function postManualKycSubmission(
  accessToken: string,
  formData: FormData,
): Promise<unknown> {
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
  return data
}
