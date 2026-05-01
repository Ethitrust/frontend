import { z } from 'zod'

export const verifyEmailPayloadSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code from your email'),
})

export type VerifyEmailPayload = z.infer<typeof verifyEmailPayloadSchema>

export const resendVerificationPayloadSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
})

export type ResendVerificationPayload = z.infer<typeof resendVerificationPayloadSchema>
