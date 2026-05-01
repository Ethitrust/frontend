import { Suspense } from 'react'

import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export const metadata = {
  title: 'Reset password — Ethi-Trust',
  description: 'Set a new password for your Ethi-Trust account.',
}

function ResetPasswordFallback() {
  return (
    <Card className="flex w-full max-w-md flex-col items-center gap-4 border-border py-16 shadow-sm">
      <Spinner className="size-8 text-accent" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  )
}
