import { OrgWorkspaceLayout } from '@/components/org/org-workspace-layout'

export default async function OrgAppLayout({
  children,
  params,
}: LayoutProps<'/org/[org_id]'>) {
  const { org_id } = await params
  return <OrgWorkspaceLayout orgId={org_id}>{children}</OrgWorkspaceLayout>
}
