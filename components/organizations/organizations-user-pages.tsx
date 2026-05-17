'use client'

import { Suspense } from 'react'

import { OrganizationApplyView } from '@/components/organizations/organization-apply-view'
import {
  OrgInviteDecisionView,
  OrgInvitesLoading,
  OrgInvitesView,
} from '@/components/organizations/org-invites-view'
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
      description="Review and respond to workspace invitations addressed to your account."
    >
      {(token) => (
        <Suspense fallback={<OrgInvitesLoading />}>
          <OrgInvitesView accessToken={token} />
        </Suspense>
      )}
    </OrganizationsSessionGate>
  )
}

export function OrgInviteDecisionRoute() {
  return (
    <OrganizationsSessionGate
      title="Respond to invitation"
      description="You followed a workspace invitation link. Sign in to accept or decline it."
    >
      {(token) => (
        <Suspense fallback={<OrgInvitesLoading />}>
          <OrgInviteDecisionView accessToken={token} />
        </Suspense>
      )}
    </OrganizationsSessionGate>
  )
}
