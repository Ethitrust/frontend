import { AdminRiskEventsRoutedPage } from '@/components/admin/admin-risk-routed-pages'

export const metadata = {
  title: 'Risk Events Log — Risk Monitoring — Ethi-Trust Admin',
  description: 'Detailed log of behavioral risk signals and system flags',
}

export default function RiskEventsPage() {
  return <AdminRiskEventsRoutedPage />
}
