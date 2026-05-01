import type { Metadata } from 'next'

import { OrgEscrowDetailView } from '@/components/org/org-escrow-detail-view'

export const metadata: Metadata = {
  title: 'Org escrow — Ethi-Trust',
  description: 'Organization escrow detail.',
}

type Props = {
  params: Promise<{ org_id: string; escrow_id: string }>
}

export default async function OrgEscrowDetailPage({ params }: Props) {
  const { org_id, escrow_id } = await params
  return <OrgEscrowDetailView orgId={org_id} escrowId={escrow_id} />
}
