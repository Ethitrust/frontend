'use client'

import { getBffErrorMessage } from '@/lib/api/upstream-errors'

import type {
  AdminDisputeAssignMediatorBody,
  AdminDisputeActionBody,
  AdminDisputeEvidenceTamperBody,
  AdminDisputeListRow,
  AdminDisputeResolutionNoteBody,
  AdminEscrowActionBody,
  AdminEscrowFlagBody,
  AdminEscrowListRow,
  AdminEscrowRelated,
  AdminFeeReconcileRow,
  AdminFeeRow,
  AdminPaginatedEnvelope,
  AdminTransactionRow,
  AdminWalletLockRow,
  AdminWalletRow,
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

async function adminPostJson(accessToken: string, pathname: string, body: unknown): Promise<unknown> {
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

export async function fetchAdminEscrows(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminEscrowListRow>> {
  return adminGetJson(accessToken, `/api/me/admin/escrows?${listQs(page, pageSize)}`)
}

export async function fetchAdminDisputes(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminDisputeListRow>> {
  return adminGetJson(accessToken, `/api/me/admin/disputes?${listQs(page, pageSize)}`)
}

export async function fetchAdminWallets(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminWalletRow>> {
  return adminGetJson(accessToken, `/api/me/admin/wallets?${listQs(page, pageSize)}`)
}

/** Page through admin wallets until all `walletIds` have an owner (or list ends). */
export async function resolveAdminWalletOwnerIds(
  accessToken: string,
  walletIds: readonly string[],
  opts?: { pageSize?: number; maxPages?: number },
): Promise<Record<string, string>> {
  const need = new Set(walletIds.filter((id) => typeof id === 'string' && id.trim()))
  const map: Record<string, string> = {}
  if (need.size === 0) return map

  const pageSize = Math.min(Math.max(opts?.pageSize ?? 100, 1), 100)
  const maxPages = Math.min(Math.max(opts?.maxPages ?? 25, 1), 50)

  for (let page = 1; page <= maxPages && need.size > 0; page += 1) {
    const r = await fetchAdminWallets(accessToken, page, pageSize)
    for (const w of r.items) {
      if (need.has(w.wallet_id) && w.owner_id) {
        map[w.wallet_id] = w.owner_id
        need.delete(w.wallet_id)
      }
    }
    if (r.items.length < pageSize) break
  }

  return map
}

export async function fetchAdminTransactions(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminTransactionRow>> {
  return adminGetJson(accessToken, `/api/me/admin/transactions?${listQs(page, pageSize)}`)
}

export async function fetchAdminTransactionsFailures(accessToken: string): Promise<unknown> {
  return adminGetJson<unknown>(accessToken, '/api/me/admin/transactions/failures')
}

export async function fetchAdminWalletLocks(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminWalletLockRow>> {
  return adminGetJson(accessToken, `/api/me/admin/wallet-locks?${listQs(page, pageSize)}`)
}

export async function fetchAdminFees(
  accessToken: string,
  page: number,
  pageSize: number,
): Promise<AdminPaginatedEnvelope<AdminFeeRow>> {
  return adminGetJson(accessToken, `/api/me/admin/fees?${listQs(page, pageSize)}`)
}

export async function fetchAdminFeesReconcile(accessToken: string): Promise<AdminFeeReconcileRow[]> {
  return adminGetJson(accessToken, '/api/me/admin/fees/reconcile')
}

export async function fetchAdminWalletStuckFunds(
  accessToken: string,
  walletId: string,
): Promise<unknown> {
  const id = encodeURIComponent(walletId)
  return adminGetJson(accessToken, `/api/me/admin/wallets/${id}/stuck-funds`)
}

/** Escrow drill (opaque JSON from upstream). */

export async function fetchAdminEscrowTimeline(
  accessToken: string,
  escrowId: string,
): Promise<unknown> {
  const id = encodeURIComponent(escrowId)
  return adminGetJson(accessToken, `/api/me/admin/escrows/${id}/timeline`)
}

export async function fetchAdminEscrowMilestones(
  accessToken: string,
  escrowId: string,
): Promise<unknown> {
  const id = encodeURIComponent(escrowId)
  return adminGetJson(accessToken, `/api/me/admin/escrows/${id}/milestones`)
}

export async function fetchAdminEscrowCounterOffers(
  accessToken: string,
  escrowId: string,
): Promise<unknown> {
  const id = encodeURIComponent(escrowId)
  return adminGetJson(accessToken, `/api/me/admin/escrows/${id}/counter-offers`)
}

export async function fetchAdminEscrowRecurringCycles(
  accessToken: string,
  escrowId: string,
): Promise<unknown> {
  const id = encodeURIComponent(escrowId)
  return adminGetJson(accessToken, `/api/me/admin/escrows/${id}/recurring-cycles`)
}

export async function fetchAdminEscrowRelated(
  accessToken: string,
  escrowId: string,
): Promise<AdminEscrowRelated> {
  const id = encodeURIComponent(escrowId)
  return adminGetJson(accessToken, `/api/me/admin/escrows/${id}/related`)
}

export async function fetchAdminEscrowLockFlow(
  accessToken: string,
  escrowId: string,
): Promise<unknown> {
  const id = encodeURIComponent(escrowId)
  return adminGetJson(accessToken, `/api/me/admin/escrows/${id}/lock-flow`)
}

export async function postAdminEscrowFlag(
  accessToken: string,
  escrowId: string,
  body: AdminEscrowFlagBody,
): Promise<unknown> {
  const id = encodeURIComponent(escrowId)
  return adminPostJson(accessToken, `/api/me/admin/escrows/${id}/flag`, body)
}

export async function postAdminEscrowAction(
  accessToken: string,
  escrowId: string,
  body: AdminEscrowActionBody,
): Promise<unknown> {
  const id = encodeURIComponent(escrowId)
  return adminPostJson(accessToken, `/api/me/admin/escrows/${id}/action`, body)
}

export async function fetchAdminDisputeThread(
  accessToken: string,
  disputeId: string,
): Promise<unknown> {
  const id = encodeURIComponent(disputeId)
  return adminGetJson(accessToken, `/api/me/admin/disputes/${id}/thread`)
}

export async function postAdminDisputeAssignMediator(
  accessToken: string,
  disputeId: string,
  body: AdminDisputeAssignMediatorBody,
): Promise<unknown> {
  const id = encodeURIComponent(disputeId)
  return adminPostJson(accessToken, `/api/me/admin/disputes/${id}/assign-mediator`, body)
}

export async function postAdminDisputeResolutionNote(
  accessToken: string,
  disputeId: string,
  body: AdminDisputeResolutionNoteBody,
): Promise<unknown> {
  const id = encodeURIComponent(disputeId)
  return adminPostJson(accessToken, `/api/me/admin/disputes/${id}/resolution-note`, body)
}

export async function postAdminDisputeAction(
  accessToken: string,
  disputeId: string,
  body: AdminDisputeActionBody,
): Promise<unknown> {
  const id = encodeURIComponent(disputeId)
  return adminPostJson(accessToken, `/api/me/admin/disputes/${id}/action`, body)
}

export async function postAdminDisputeEvidenceTamper(
  accessToken: string,
  evidenceId: string,
  body: AdminDisputeEvidenceTamperBody,
): Promise<unknown> {
  const id = encodeURIComponent(evidenceId)
  return adminPostJson(accessToken, `/api/me/admin/disputes/evidence/${id}/tamper`, body)
}

export async function fetchAdminDisputeForensics(
  accessToken: string,
  disputeId: string,
): Promise<unknown> {
  const id = encodeURIComponent(disputeId)
  return adminGetJson(accessToken, `/api/me/admin/disputes/${id}/forensics`)
}

export async function postAdminDisputeAnalyzeChat(
  accessToken: string,
  disputeId: string,
): Promise<unknown> {
  const id = encodeURIComponent(disputeId)
  return adminPostJson(accessToken, `/api/me/admin/disputes/${id}/analyze-chat`, {})
}

export async function postAdminEvidenceRerunEla(
  accessToken: string,
  evidenceId: string,
): Promise<unknown> {
  const id = encodeURIComponent(evidenceId)
  return adminPostJson(accessToken, `/api/me/admin/disputes/evidence/${id}/rerun-ela`, {})
}
