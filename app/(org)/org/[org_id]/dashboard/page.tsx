import { OrgDashboardView } from '@/components/org/org-dashboard-view'

export const metadata = {
  title: 'Org dashboard — Ethi-Trust',
  description: 'Organization workspace dashboard and escrow reporting.',
}

type Props = {
  params: Promise<{ org_id: string }>
}

export default async function OrgDashboardPage({ params }: Props) {
  const { org_id } = await params
  return <OrgDashboardView orgId={org_id} />
}
