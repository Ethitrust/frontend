'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  PaginatedWalletTransactions,
  SupportedBank,
  WalletRow,
} from '@/lib/wallets/wallet-types'

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchMeWalletList(accessToken: string): Promise<WalletRow[]> {
  const res = await fetch('/api/me/wallets', {
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
    throw new Error('Unexpected wallet list response.')
  }
  return data as WalletRow[]
}

export async function fetchMeWalletTransactions(
  accessToken: string,
  walletId: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedWalletTransactions> {
  const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  const res = await fetch(`/api/me/wallets/${walletId}/transactions?${q.toString()}`, {
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
  if (!data || typeof data !== 'object' || !('items' in (data as object))) {
    throw new Error('Unexpected transactions response.')
  }
  return data as PaginatedWalletTransactions
}

export function pickDefaultWalletId(wallets: WalletRow[]): string | null {
  if (!wallets.length) return null
  const etb = wallets.find((w) => w.currency === 'ETB')
  return (etb ?? wallets[0])!.id
}

/** Find a payment URL in a fund API response (apidoc body is open-ended). */
export function extractPaymentRedirectUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const o = data as Record<string, unknown>
  const keys = [
    'checkout_url',
    'payment_url',
    'authorization_url',
    'redirect_url',
    'paymentUrl',
    'checkoutUrl',
    'url',
  ] as const
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string' && /^https?:\/\//i.test(v.trim())) return v.trim()
  }
  return null
}

export async function fetchSupportedBanks(
  accessToken: string,
  opts?: { currency?: string; provider?: string },
): Promise<SupportedBank[]> {
  const q = new URLSearchParams({
    currency: opts?.currency ?? 'ETB',
    provider: opts?.provider ?? 'chapa',
  })
  const res = await fetch(`/api/me/wallets/banks?${q}`, {
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
    throw new Error('Unexpected banks response.')
  }
  return data as SupportedBank[]
}

export async function postFundWallet(
  accessToken: string,
  walletId: string,
  body: { amount: number; return_url: string },
): Promise<unknown> {
  const res = await fetch(`/api/me/wallets/${encodeURIComponent(walletId)}/fund`, {
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
  return data
}

export async function postWithdrawFromWallet(
  accessToken: string,
  walletId: string,
  body: {
    amount: number
    account_number: string
    bank_code: string
    description: string
  },
): Promise<unknown> {
  const res = await fetch(`/api/me/wallets/${encodeURIComponent(walletId)}/withdraw`, {
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
  return data
}
