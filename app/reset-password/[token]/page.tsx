import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { ConfirmResetPasswordForm } from '@/components/auth/confirm-reset-password-form'

type Props = { params: Promise<{ token: string }> }

export const metadata = {
  title: 'Reset password — Ethi-Trust',
  description: 'Confirm reset password for your Ethi-Trust account.',
}

export default async function ConfirmResetPasswordPage({ params }: Props) {
  const { token } = await params
  return (
    <AuthPageShell>
      <ConfirmResetPasswordForm token={decodeURIComponent(token)} />
    </AuthPageShell>
  )
}
