import { UserWalletOverview } from '@/components/wallet/user-wallet-overview'

export const metadata = {
  title: 'Wallet — Ethi-Trust',
  description: 'Your balances, locked funds in escrow, and recent wallet transactions.',
}

export default function WalletPage() {
  return <UserWalletOverview />
}
