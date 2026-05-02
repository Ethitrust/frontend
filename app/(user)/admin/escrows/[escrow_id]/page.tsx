import { AdminEscrowConsoleRoutedPage } from '@/components/admin/admin-platform-routed-pages'

type Props = { params: Promise<{ escrow_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { escrow_id } = await params
  return {
    title: `Escrow ${escrow_id} — Ethi-Trust Admin`,
    description: 'Escrow timeline, tooling, and operator actions.',
  }
}

export default async function AdminEscrowConsolePage({ params }: Props) {
  const { escrow_id } = await params
  const id = decodeURIComponent(escrow_id)
  return <AdminEscrowConsoleRoutedPage escrowId={id} />
}
