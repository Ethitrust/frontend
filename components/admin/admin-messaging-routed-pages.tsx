'use client'

import { AdminOperatorGate } from '@/components/admin/admin-operator-gate'
import { AdminAuditLogsListView } from '@/components/admin/admin-audit-logs-list-view'
import { AdminDomainEventsListView } from '@/components/admin/admin-domain-events-list-view'
import { AdminEventPayloadView } from '@/components/admin/admin-event-payload-view'
import { AdminNotificationDeliveriesListView } from '@/components/admin/admin-notification-deliveries-list-view'

export function AdminNotificationDeliveriesRoutedPage() {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminNotificationDeliveriesListView accessToken={accessToken} />}
    </AdminOperatorGate>
  )
}

export function AdminDomainEventsRoutedPage() {
  return (
    <AdminOperatorGate>{({ accessToken }) => <AdminDomainEventsListView accessToken={accessToken} />}</AdminOperatorGate>
  )
}

export function AdminEventPayloadRoutedPage({ eventId }: { eventId: string }) {
  return (
    <AdminOperatorGate>
      {({ accessToken }) => <AdminEventPayloadView accessToken={accessToken} eventId={eventId} />}
    </AdminOperatorGate>
  )
}

export function AdminAuditLogsRoutedPage() {
  return (
    <AdminOperatorGate>{({ accessToken }) => <AdminAuditLogsListView accessToken={accessToken} />}</AdminOperatorGate>
  )
}
