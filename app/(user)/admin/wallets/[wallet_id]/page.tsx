import { AdminWalletInvestigationRoutedPage } from '@/components/admin/admin-platform-routed-pages'

type Props = { params: Promise<{ wallet_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { wallet_id } = await params
  return {
    title: `Wallet ${wallet_id} — Ethi-Trust Admin`,
    description: 'Stuck funds and wallet investigation tooling.',
  }
}

export default async function AdminWalletInvestigationPage({ params }: Props) {
  const { wallet_id } = await params
  const id = decodeURIComponent(wallet_id)
  return <AdminWalletInvestigationRoutedPage walletId={id} />
}
