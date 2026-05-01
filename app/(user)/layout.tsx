import { UserWorkspaceLayout } from '@/components/dashboard/user-workspace-layout'

export default function UserAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <UserWorkspaceLayout>{children}</UserWorkspaceLayout>
}
