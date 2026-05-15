'use client'

import { AdminOperatorGate } from '@/components/admin/admin-operator-gate'
import { AdminRiskCircularFlowsView } from '@/components/admin/admin-risk-circular-flows-view'
import { AdminRiskConfigView } from '@/components/admin/admin-risk-config-view'
import { AdminRiskDashboardView } from '@/components/admin/admin-risk-dashboard-view'
import { AdminRiskEventsView } from '@/components/admin/admin-risk-events-view'
import { AdminRiskReviewQueueView } from '@/components/admin/admin-risk-review-queue-view'
import { AdminRiskUserProfileView } from '@/components/admin/admin-risk-user-profile-view'

export function AdminRiskDashboardRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminRiskDashboardView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminRiskReviewQueueRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken, me }) => (
        <AdminRiskReviewQueueView accessToken={accessToken} adminId={me.id} />
      )}
    </AdminOperatorGate>
  )
}

export function AdminRiskUsersRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminRiskUserProfileView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminRiskCircularFlowsRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken, me }) => (
        <AdminRiskCircularFlowsView accessToken={accessToken} adminId={me.id} />
      )}
    </AdminOperatorGate>
  )
}

export function AdminRiskEventsRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminRiskEventsView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminRiskConfigRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminRiskConfigView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}
