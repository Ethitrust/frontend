/** Shapes from `docs/apidoc.md` § wallets */

export type WalletRow = {
  id: string
  owner_id: string
  owner_type: string
  currency: string
  balance: number
  locked_balance: number
  status: string
  created_at: string
  updated_at: string
}

export type WalletTransactionItem = {
  id: string
  wallet_id: string
  escrow_id?: string | null
  type: string
  amount: number
  currency: string
  status: string
  reference?: string | null
  description?: string | null
  provider?: string | null
  created_at: string
}

export type PaginatedWalletTransactions = {
  items: WalletTransactionItem[]
  page: number
  page_size: number
  total: number
}

/** `GET /api/v1/wallets/banks` list item */
export type SupportedBank = {
  id: number
  slug: string
  swift?: string | null
  name: string
  acct_length?: number | null
  country_id?: number | null
  is_mobilemoney?: boolean | null
  is_active?: number | null
  is_rtgs?: number | null
  active?: number | null
  is_24hrs?: number | null
  created_at?: string | null
  updated_at?: string | null
  currency?: string | null
}
