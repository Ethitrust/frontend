import { Suspense } from 'react'
import type { Metadata } from 'next'
import { EscrowInviteLanding } from '@/components/invite/escrow-invite-landing'

type Props = { params: Promise<{ escrow_id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { escrow_id } = await params
  return {
    title: `Escrow Invitation | Ethitrust`,
    description:
      'Review and accept your escrow invitation on Ethitrust.',
  }
}

export default async function InvitePage({ params }: Props) {
  const { escrow_id } = await params

  return (
    <Suspense fallback={null}>
      <EscrowInviteLanding escrowId={escrow_id} />
    </Suspense>
  )
}
