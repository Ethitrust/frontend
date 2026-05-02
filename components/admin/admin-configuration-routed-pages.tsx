'use client'

import { AdminOperatorGate } from '@/components/admin/admin-operator-gate'
import { AdminPlatformSettingsListView } from '@/components/admin/admin-platform-settings-list-view'
import { AdminSupportCasesListView } from '@/components/admin/admin-support-cases-list-view'

export function AdminSupportCasesRoutedPage() {
  return (
    <AdminOperatorGate>{({ accessToken }) => <AdminSupportCasesListView accessToken={accessToken} />}</AdminOperatorGate>
  )
}

export function AdminPlatformSettingsRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminPlatformSettingsListView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}
