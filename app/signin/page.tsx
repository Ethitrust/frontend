import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign in — Ethi-Trust',
  description: 'Sign in to your Ethi-Trust workspace.',
}

export default function SignInPage() {
  return (
    <AuthPageShell>
      <LoginForm />
    </AuthPageShell>
  )
}
