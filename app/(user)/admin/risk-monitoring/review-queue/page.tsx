import { AdminRiskReviewQueueRoutedPage } from '@/components/admin/admin-risk-routed-pages'

export const metadata = {
  title: 'Review Queue — Risk Monitoring — Ethi-Trust Admin',
  description: 'Manual review queue for flagged transactions and users',
}

export default function RiskReviewQueuePage() {
  return <AdminRiskReviewQueueRoutedPage />
}
