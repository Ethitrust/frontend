import { OrgWalletTransactionsView } from '@/components/org/org-wallet-transactions-view'

export const metadata = {
  title: 'Transactions — Org wallet — Ethi-Trust',
  description: 'Transaction history for an organization wallet.',
}

type Props = {
  params: Promise<{ org_id: string }>
  searchParams: Promise<{ wallet_id?: string }>
}

export default async function OrgWalletTransactionsPage({ params, searchParams }: Props) {
  const { org_id } = await params
  const { wallet_id } = await searchParams
  return <OrgWalletTransactionsView orgId={org_id} initialWalletId={wallet_id} />
}
