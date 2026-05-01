import type { Metadata } from 'next'

import { UserProfileView } from '@/components/profile/user-profile-view'

export const metadata: Metadata = {
  title: 'Profile — Ethi-Trust',
  description: 'View your account and verification profile.',
}

export default function ProfilePage() {
  return <UserProfileView />
}
