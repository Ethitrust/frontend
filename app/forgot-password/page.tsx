import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata = {
  title: 'Forgot password — Ethi-Trust',
  description: 'Reset your Ethi-Trust account password.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <ForgotPasswordForm />
    </AuthPageShell>
  )
}
