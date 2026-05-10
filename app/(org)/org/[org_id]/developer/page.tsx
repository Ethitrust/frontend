import { OrgDeveloperView } from '@/components/org/org-developer-view'

export const metadata = {
  title: 'Developer Hub — Ethi-Trust',
  description: 'API keys, webhooks, IP allowlist and integration guides for your organization.',
}

type Props = {
  params: Promise<{ org_id: string }>
}

export default async function OrgDeveloperPage({ params }: Props) {
  const { org_id } = await params
  return <OrgDeveloperView orgId={org_id} />
}
