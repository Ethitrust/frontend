import { OrgWalletWithdrawView } from '@/components/org/org-wallet-withdraw-view'

export const metadata = {
  title: 'Withdraw — Org wallet — Ethi-Trust',
  description: 'Withdraw funds from an organization wallet to a beneficiary bank account.',
}

type Props = {
  params: Promise<{ org_id: string }>
  searchParams: Promise<{ wallet_id?: string }>
}

export default async function OrgWalletWithdrawPage({ params, searchParams }: Props) {
  const { org_id } = await params
  const { wallet_id } = await searchParams
  return <OrgWalletWithdrawView orgId={org_id} initialWalletId={wallet_id} />
}
