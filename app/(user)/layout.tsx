import { Suspense } from 'react'

import { UserWorkspaceLayout } from '@/components/dashboard/user-workspace-layout'
import { KycGuardProvider } from '@/components/kyc/kyc-guard-provider'
import { KycRouteGuard } from '@/components/kyc/kyc-route-guard'

export default function UserAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <UserWorkspaceLayout>
      <KycGuardProvider>
        <Suspense fallback={null}>
          <KycRouteGuard>{children}</KycRouteGuard>
        </Suspense>
      </KycGuardProvider>
    </UserWorkspaceLayout>
  )
}
