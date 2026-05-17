"use client";

import { getBffErrorMessage } from "@/lib/api/upstream-errors";

import type {
  PaginatedWalletTransactions,
  WalletRow,
} from "@/lib/wallets/wallet-types";

export type OrgWalletWithdrawBody = {
  amount: number;
  account_number: string;
  bank_code: number | null;
  description?: string | null;
};

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** GET `/api/v1/organizations/{org_id}/wallets` — list an org's wallets. */
export async function fetchOrgWalletList(
  accessToken: string,
  orgId: string,
): Promise<WalletRow[]> {
  const res = await fetch(`/api/me/org/${encodeURIComponent(orgId)}/wallets`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (!Array.isArray(data)) {
    throw new Error("Unexpected org wallet list response.");
  }
  return data as WalletRow[];
}

/** GET `/api/v1/organizations/{org_id}/wallets/{wallet_id}` — single org wallet. */
export async function fetchOrgWallet(
  accessToken: string,
  orgId: string,
  walletId: string,
): Promise<WalletRow> {
  const res = await fetch(
    `/api/me/org/${encodeURIComponent(orgId)}/wallets/${encodeURIComponent(walletId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as WalletRow).id !== "string"
  ) {
    throw new Error("Unexpected org wallet response.");
  }
  return data as WalletRow;
}

/** GET `/api/v1/organizations/{org_id}/wallets/{wallet_id}/transactions` */
export async function fetchOrgWalletTransactions(
  accessToken: string,
  orgId: string,
  walletId: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedWalletTransactions> {
  const q = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await fetch(
    `/api/me/org/${encodeURIComponent(orgId)}/wallets/${encodeURIComponent(walletId)}/transactions?${q.toString()}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (!data || typeof data !== "object" || !("items" in (data as object))) {
    throw new Error("Unexpected transactions response.");
  }
  return data as PaginatedWalletTransactions;
}

/** POST `/api/v1/organizations/{org_id}/wallets/{wallet_id}/withdraw` — owner only. Often 202. */
export async function postOrgWalletWithdraw(
  accessToken: string,
  orgId: string,
  walletId: string,
  body: OrgWalletWithdrawBody,
): Promise<void> {
  const res = await fetch(
    `/api/me/org/${encodeURIComponent(orgId)}/wallets/${encodeURIComponent(walletId)}/withdraw`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: body.amount,
        account_number: body.account_number,
        bank_code: body.bank_code,
        description: body.description ?? "",
      }),
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
}
