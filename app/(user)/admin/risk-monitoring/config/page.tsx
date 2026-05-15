import { AdminRiskConfigRoutedPage } from '@/components/admin/admin-risk-routed-pages'

export const metadata = {
  title: 'Risk Configuration — Risk Monitoring — Ethi-Trust Admin',
  description: 'Adjust fraud detection thresholds and behavioral analysis parameters',
}

export default function RiskConfigPage() {
  return <AdminRiskConfigRoutedPage />
}
