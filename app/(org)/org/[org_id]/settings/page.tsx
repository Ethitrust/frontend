import { OrgSettingsView } from '@/components/org/org-settings-view'

export const metadata = {
  title: 'Org settings — Ethi-Trust',
  description: 'Organization profile and API keys.',
}

type Props = {
  params: Promise<{ org_id: string }>
}

export default async function OrgSettingsPage({ params }: Props) {
  const { org_id } = await params
  return <OrgSettingsView orgId={org_id} />
}
