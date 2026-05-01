import { WalletTransactionsView } from '@/components/wallet/wallet-transactions-view'

export const metadata = {
  title: 'Transactions — Ethi-Trust',
  description: 'Wallet deposits, withdrawals, and other balance movements.',
}

export default function WalletTransactionsPage() {
  return <WalletTransactionsView />
}
