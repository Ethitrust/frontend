'use client'

import { ModeratorOperatorGate } from '@/components/moderator/moderator-operator-gate'
import { ModeratorDashboardView } from '@/components/moderator/moderator-dashboard-view'
import { ModeratorDisputesAssignedView } from '@/components/moderator/moderator-disputes-assigned-view'
import { ModeratorDisputeConsoleView } from '@/components/moderator/moderator-dispute-console-view'
import { ModeratorKycSubmissionsListView } from '@/components/moderator/moderator-kyc-submissions-list-view'
import { ModeratorKycSubmissionDetailView } from '@/components/moderator/moderator-kyc-submission-detail-view'

export function ModeratorDashboardRoutedPage() {
  return (
    <ModeratorOperatorGate>
      {() => <ModeratorDashboardView />}
    </ModeratorOperatorGate>
  )
}

export function ModeratorDisputesAssignedRoutedPage() {
  return (
    <ModeratorOperatorGate>
      {({ accessToken }) => <ModeratorDisputesAssignedView accessToken={accessToken} />}
    </ModeratorOperatorGate>
  )
}

export function ModeratorDisputeConsoleRoutedPage({ disputeId }: { disputeId: string }) {
  return (
    <ModeratorOperatorGate>
      {({ accessToken }) => (
        <ModeratorDisputeConsoleView accessToken={accessToken} disputeId={disputeId} />
      )}
    </ModeratorOperatorGate>
  )
}

export function ModeratorKycSubmissionsRoutedPage() {
  return (
    <ModeratorOperatorGate>
      {({ accessToken }) => <ModeratorKycSubmissionsListView accessToken={accessToken} />}
    </ModeratorOperatorGate>
  )
}

export function ModeratorKycSubmissionDetailRoutedPage({ submissionId }: { submissionId: string }) {
  return (
    <ModeratorOperatorGate>
      {({ accessToken }) => (
        <ModeratorKycSubmissionDetailView accessToken={accessToken} submissionId={submissionId} />
      )}
    </ModeratorOperatorGate>
  )
}
