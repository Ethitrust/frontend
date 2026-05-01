import type { Metadata } from 'next'

import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { InvitePrecheckPanel } from '@/components/invite/invite-precheck-panel'

type Props = { params: Promise<{ escrow_id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { escrow_id } = await params
  return {
    title: `Escrow invite — ${escrow_id}`,
    description:
      'Review what you need before accepting this escrow on Ethi-Trust.',
  }
}

export default async function InvitePage({ params }: Props) {
  const { escrow_id } = await params

  return (
    <AuthPageShell>
      <InvitePrecheckPanel escrowId={escrow_id} />
    </AuthPageShell>
  )
}
