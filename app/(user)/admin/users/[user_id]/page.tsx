import { AdminUserWorkspaceShell } from '@/components/admin/admin-user-workspace-view'

type Props = { params: Promise<{ user_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { user_id } = await params
  return {
    title: `User ${user_id} — Ethi-Trust Admin`,
    description: 'Operator workspace for account review.',
  }
}

export default async function AdminUserWorkspacePage({ params }: Props) {
  const { user_id } = await params
  return <AdminUserWorkspaceShell userId={decodeURIComponent(user_id)} />
}
