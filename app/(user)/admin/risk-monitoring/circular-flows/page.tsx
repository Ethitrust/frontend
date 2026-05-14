import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AdminRiskCircularFlowsView } from '@/components/admin/admin-risk-circular-flows-view'

export const metadata = {
  title: 'Circular Flow Detection — Risk Monitoring — Ethi-Trust Admin',
  description: 'Detect and investigate circular money flows',
}

export default async function RiskCircularFlowsPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  const userId = cookieStore.get('user_id')?.value

  if (!accessToken || !userId) {
    redirect('/login')
  }

  return <AdminRiskCircularFlowsView accessToken={accessToken} adminId={userId} />
}
