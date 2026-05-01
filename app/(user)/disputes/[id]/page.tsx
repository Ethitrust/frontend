import { UserDisputeThreadPage } from '@/components/disputes/disputes-user-pages'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  return {
    title: `Dispute ${id} — Ethi-Trust`,
    description: 'Dispute thread.',
  }
}

export default async function DisputeThreadPage({ params }: Props) {
  const { id } = await params

  return <UserDisputeThreadPage disputeId={id} />
}
