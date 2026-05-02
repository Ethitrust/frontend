'use client'

import { AdminOperatorGate } from '@/components/admin/admin-operator-gate'
import { AdminOrgApplicationDetailView } from '@/components/admin/admin-org-application-detail-view'
import { AdminOrgApplicationsListView } from '@/components/admin/admin-org-applications-list-view'

export function AdminOrgApplicationsRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminOrgApplicationsListView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminOrgApplicationDetailRoutedPage({ applicationId }: { applicationId: string }) {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => (
        <AdminOrgApplicationDetailView accessToken={accessToken} applicationId={applicationId} />
      )}
    </AdminOperatorGate>
  )
}
