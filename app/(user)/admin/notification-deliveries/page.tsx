import { AdminNotificationDeliveriesRoutedPage } from '@/components/admin/admin-messaging-routed-pages'

export const metadata = {
  title: 'Notification deliveries — Ethi-Trust Admin',
  description: 'Operator view of outbound notification deliveries and retries.',
}

export default function AdminNotificationDeliveriesPage() {
  return <AdminNotificationDeliveriesRoutedPage />
}
