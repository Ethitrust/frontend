import { Suspense } from 'react'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Create account — Ethi-Trust',
  description:
    'Open an Ethi-Trust workspace for your business. Verified escrow accounts for Ethiopian B2B commerce.',
}

export default function SignupPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </AuthPageShell>
  )
}
