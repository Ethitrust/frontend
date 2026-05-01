import type { Metadata } from 'next'

import { UserNotificationsView } from '@/components/notifications/user-notifications-view'

export const metadata: Metadata = {
  title: 'Notifications — Ethi-Trust',
  description: 'Your Ethi-Trust in-app notifications.',
}

export default function NotificationsPage() {
  return <UserNotificationsView />
}
