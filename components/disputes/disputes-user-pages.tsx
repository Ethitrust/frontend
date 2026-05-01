'use client'

import { DisputeThreadView } from '@/components/disputes/dispute-thread-view'
import { DisputesListView } from '@/components/disputes/disputes-list-view'
import { DisputesSessionGate } from '@/components/disputes/disputes-session-gate'

export function UserDisputesListPage() {
  return (
    <DisputesSessionGate
      title="Disputes"
      description="Review open escrow negotiations where you raised or joined a disagreement. Threads stay private to your mediation room until the matter is settled or closed."
    >
      {(token) => <DisputesListView accessToken={token} />}
    </DisputesSessionGate>
  )
}

export function UserDisputeThreadPage({ disputeId }: { disputeId: string }) {
  return (
    <DisputesSessionGate
      title="Dispute room"
      description="Negotiate with the other escrow party through messages, attach evidence uploads, propose a settlement outcome, then confirm once both sides agree—without leaving Ethi-Trust."
    >
      {(token) => <DisputeThreadView accessToken={token} disputeId={disputeId} />}
    </DisputesSessionGate>
  )
}
