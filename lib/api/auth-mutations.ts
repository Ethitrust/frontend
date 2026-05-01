'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { LoginSuccess, RegisterUser } from '@/lib/api/auth-types'
import { authPostJson } from '@/lib/api/auth-client'
import type { LoginPayload } from '@/lib/validators/login'
import type { SignupPayload } from '@/lib/validators/signup'
import type { ResendVerificationPayload, VerifyEmailPayload } from '@/lib/validators/verify-email'
import { useAuthStore } from '@/stores/auth-store'

export function useLoginMutation() {
  const setTokens = useAuthStore((s) => s.setTokens)

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      authPostJson<LoginSuccess>('/api/auth/login', payload),
    onSuccess: (data) => {
      setTokens(data.access_token, data.token_type ?? 'bearer')
      toast.success('Signed in.')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: SignupPayload) =>
      authPostJson<RegisterUser>('/api/auth/signup', payload),
    onSuccess: () => {
      toast.success(
        'Account created. Check your inbox for a 6-digit code to verify your email.',
      )
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) =>
      authPostJson<Record<string, unknown>>('/api/auth/verify-email', payload),
    onSuccess: () => {
      toast.success('Email verified. You can sign in.')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (payload: ResendVerificationPayload) =>
      authPostJson<Record<string, unknown>>('/api/auth/resend-verification', payload),
    onSuccess: () => {
      toast.success('Verification email sent.')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
