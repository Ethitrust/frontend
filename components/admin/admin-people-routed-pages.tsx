'use client'

import { AdminOperatorGate } from '@/components/admin/admin-operator-gate'
import { AdminKycReviewQueueView } from '@/components/admin/admin-kyc-review-queue-view'
import { AdminKycSubmissionDetailView } from '@/components/admin/admin-kyc-submission-detail-view'
import { AdminKycSubmissionsListView } from '@/components/admin/admin-kyc-submissions-list-view'
import { AdminRiskFlagsView } from '@/components/admin/admin-risk-flags-view'
import { AdminUsersListView } from '@/components/admin/admin-users-list-view'

export function AdminUsersRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminUsersListView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminRiskFlagsRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminRiskFlagsView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminKycReviewQueueRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminKycReviewQueueView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminKycSubmissionsRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminKycSubmissionsListView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminKycSubmissionDetailRoutedPage({ submissionId }: { submissionId: string }) {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => (
        <AdminKycSubmissionDetailView accessToken={accessToken} submissionId={submissionId} />
      )}
    </AdminOperatorGate>
  )
}
