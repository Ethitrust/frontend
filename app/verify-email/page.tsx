import { Suspense } from 'react'

import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { VerifyEmailPanel } from '@/components/auth/verify-email-panel'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export const metadata = {
  title: 'Verify email — Ethi-Trust',
  description: 'Confirm your email address to continue using Ethi-Trust.',
}

function VerifyEmailFallback() {
  return (
    <Card className="flex w-full max-w-md flex-col items-center gap-4 border-border py-16 shadow-sm">
      <Spinner className="size-8 text-accent" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailPanel />
      </Suspense>
    </AuthPageShell>
  )
}
