import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AdminRiskDashboardView } from '@/components/admin/admin-risk-dashboard-view'

export const metadata = {
  title: 'Risk Monitoring Dashboard — Ethi-Trust Admin',
  description: 'Real-time fraud detection and risk monitoring dashboard',
}

export default async function RiskMonitoringDashboardPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  return <AdminRiskDashboardView accessToken={accessToken} />
}
