import { ModeratorDisputeConsoleRoutedPage } from '@/components/moderator/moderator-routed-pages'

type Props = { params: Promise<{ dispute_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { dispute_id } = await params
  return {
    title: `Dispute ${dispute_id} — Ethi-Trust Moderator`,
    description: 'Dispute thread, resolution tools, and forensics.',
  }
}

export default async function ModeratorDisputeConsolePage({ params }: Props) {
  const { dispute_id } = await params
  const id = decodeURIComponent(dispute_id)
  return <ModeratorDisputeConsoleRoutedPage disputeId={id} />
}
