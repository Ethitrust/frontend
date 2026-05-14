import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AdminRiskReviewQueueView } from '@/components/admin/admin-risk-review-queue-view'

export const metadata = {
  title: 'Review Queue — Risk Monitoring — Ethi-Trust Admin',
  description: 'Manual review queue for flagged transactions and users',
}

export default async function RiskReviewQueuePage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  const userId = cookieStore.get('user_id')?.value

  if (!accessToken || !userId) {
    redirect('/login')
  }

  return <AdminRiskReviewQueueView accessToken={accessToken} adminId={userId} />
}
