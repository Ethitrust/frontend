import { Suspense } from 'react'
import { OrgInvitesRoute } from '@/components/organizations/organizations-user-pages'

export const metadata = {
  title: 'Organization invites — Ethi-Trust',
  description: 'Pending organization invitations.',
}

export default function OrgInvitesPage() {
  return (
    <Suspense fallback={null}>
      <OrgInvitesRoute />
    </Suspense>
  )
}
