import type { Metadata } from 'next'

import { EscrowMilestonesView } from '@/components/escrows/escrow-milestones-view'

type Props = { params: Promise<{ escrow_id: string }> }

export async function generateMetadata(_props: Props): Promise<Metadata> {
  return {
    title: 'Milestones — Ethi-Trust',
    description: 'Escrow milestones.',
  }
}

export default async function EscrowMilestonesPage({ params }: Props) {
  const { escrow_id } = await params
  return <EscrowMilestonesView escrowId={escrow_id} />
}
