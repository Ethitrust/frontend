import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AdminRiskUserProfileView } from '@/components/admin/admin-risk-user-profile-view'

export const metadata = {
  title: 'User Risk Profiles — Risk Monitoring — Ethi-Trust Admin',
  description: 'View and manage user risk profiles and scores',
}

export default async function RiskUserProfilesPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  return <AdminRiskUserProfileView accessToken={accessToken} />
}
