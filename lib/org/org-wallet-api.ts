'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

export type OrgWalletWithdrawBody = {
  amount: number
  account_number: string
  bank_code: string
  description?: string | null
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/** POST `/api/v1/organizations/{org_id}/wallets/{wallet_id}/withdraw` → often 202 */
export async function postOrgWalletWithdraw(
  accessToken: string,
  orgId: string,
  walletId: string,
  body: OrgWalletWithdrawBody,
): Promise<void> {
  const res = await fetch(
    `/api/me/org/${encodeURIComponent(orgId)}/wallets/${encodeURIComponent(walletId)}/withdraw`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: body.amount,
        account_number: body.account_number,
        bank_code: body.bank_code,
        description: body.description ?? '',
      }),
      cache: 'no-store',
    },
  )
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data))
  }
}
