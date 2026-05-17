import { Suspense } from 'react'

import { OrgInviteDecisionRoute } from '@/components/organizations/organizations-user-pages'

export const metadata = {
  title: 'Respond to invitation — Ethi-Trust',
  description: 'Accept or decline a workspace invitation.',
}

export default function OrgInviteDecisionPage() {
  return (
    <Suspense fallback={null}>
      <OrgInviteDecisionRoute />
    </Suspense>
  )
}
