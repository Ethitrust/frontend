'use client'

import { AdminOperatorGate } from '@/components/admin/admin-operator-gate'
import { AdminDisputeConsoleView } from '@/components/admin/admin-dispute-console-view'
import { AdminDisputesListView } from '@/components/admin/admin-disputes-list-view'
import { AdminEscrowConsoleView } from '@/components/admin/admin-escrow-console-view'
import { AdminEscrowsListView } from '@/components/admin/admin-escrows-list-view'
import { AdminFeesListView } from '@/components/admin/admin-fees-list-view'
import { AdminTransactionsFailuresView } from '@/components/admin/admin-transactions-failures-view'
import { AdminTransactionsListView } from '@/components/admin/admin-transactions-list-view'
import { AdminWalletInvestigationView } from '@/components/admin/admin-wallet-investigation-view'
import { AdminWalletLocksListView } from '@/components/admin/admin-wallet-locks-list-view'
import { AdminWalletsListView } from '@/components/admin/admin-wallets-list-view'

export function AdminEscrowsRoutedPage() {
  return (
    <AdminOperatorGate>{({ accessToken }) => <AdminEscrowsListView accessToken={accessToken} />}</AdminOperatorGate>
  )
}

export function AdminEscrowConsoleRoutedPage({ escrowId }: { escrowId: string }) {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminEscrowConsoleView accessToken={accessToken} escrowId={escrowId} />}
    </AdminOperatorGate>
  )
}

export function AdminDisputesRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminDisputesListView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminDisputeConsoleRoutedPage({ disputeId }: { disputeId: string }) {
  return (
    <AdminOperatorGate>
      {({ accessToken, me }) => <AdminDisputeConsoleView accessToken={accessToken} disputeId={disputeId} currentUserId={me.id} />}
    </AdminOperatorGate>
  )
}

export function AdminTransactionsRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminTransactionsListView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminTransactionsFailuresRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminTransactionsFailuresView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminWalletsRoutedPage() {
  return (
    <AdminOperatorGate>{({ accessToken }) => <AdminWalletsListView accessToken={accessToken} />}</AdminOperatorGate>
  )
}

export function AdminWalletInvestigationRoutedPage({ walletId }: { walletId: string }) {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminWalletInvestigationView accessToken={accessToken} walletId={walletId} />}
    </AdminOperatorGate>
  )
}

export function AdminWalletLocksRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminWalletLocksListView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminFeesRoutedPage() {
  return (
    <AdminOperatorGate>{({ accessToken }) => <AdminFeesListView accessToken={accessToken} />}</AdminOperatorGate>
  )
}
