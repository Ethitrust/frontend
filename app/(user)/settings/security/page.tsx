import type { Metadata } from 'next'

import { UserSecuritySettingsView } from '@/components/settings/user-security-settings-view'

export const metadata: Metadata = {
  title: 'Security — Ethi-Trust',
  description: 'Email verification, password reset, and session security status.',
}

export default function SecuritySettingsPage() {
  return <UserSecuritySettingsView />
}
