import { AdminDisputeConsoleRoutedPage } from '@/components/admin/admin-platform-routed-pages'

type Props = { params: Promise<{ dispute_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { dispute_id } = await params
  return {
    title: `Dispute ${dispute_id} — Ethi-Trust Admin`,
    description: 'Dispute thread, moderator workflow, and evidence tools.',
  }
}

export default async function AdminDisputeConsolePage({ params }: Props) {
  const { dispute_id } = await params
  const id = decodeURIComponent(dispute_id)
  return <AdminDisputeConsoleRoutedPage disputeId={id} />
}
