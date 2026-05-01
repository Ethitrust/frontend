import { OrgWalletView } from '@/components/org/org-wallet-view'

export const metadata = {
  title: 'Org wallet — Ethi-Trust',
  description: 'Organization wallets and withdrawals.',
}

type Props = {
  params: Promise<{ org_id: string }>
}

export default async function OrgWalletPage({ params }: Props) {
  const { org_id } = await params
  return <OrgWalletView orgId={org_id} />
}
