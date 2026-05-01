'use client'

import { Suspense } from 'react'

import { OrganizationApplyView } from '@/components/organizations/organization-apply-view'
import { OrgInvitesLoading, OrgInvitesView } from '@/components/organizations/org-invites-view'
import { OrganizationsSessionGate } from '@/components/organizations/organizations-session-gate'

export function OrganizationsApplyRoute() {
  return (
    <OrganizationsSessionGate
      title="Apply as a business"
      description="Create an Ethi-Trust organization for your legal entity, attach a business licence, and wait for KYB clearance before onboarding team members."
    >
      {(token) => <OrganizationApplyView accessToken={token} />}
    </OrganizationsSessionGate>
  )
}

export function OrgInvitesRoute() {
  return (
    <OrganizationsSessionGate
      title="Team invites"
      description="Handle workspace invitations securely. Incoming links populate organization and invitation tokens automatically when present."
    >
      {(token) => (
        <Suspense fallback={<OrgInvitesLoading />}>
          <OrgInvitesView accessToken={token} />
        </Suspense>
      )}
    </OrganizationsSessionGate>
  )
}
