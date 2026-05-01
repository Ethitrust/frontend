import type { Metadata } from 'next'

import { EscrowDetailView } from '@/components/escrows/escrow-detail-view'

type Props = { params: Promise<{ escrow_id: string }> }

export async function generateMetadata(_props: Props): Promise<Metadata> {
  return {
    title: 'Escrow — Ethi-Trust',
    description: 'Escrow details and actions.',
  }
}

export default async function EscrowDetailPage({ params }: Props) {
  const { escrow_id } = await params
  return <EscrowDetailView escrowId={escrow_id} />
}
