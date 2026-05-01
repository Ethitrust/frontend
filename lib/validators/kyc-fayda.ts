import { z } from 'zod'

/** Fayda OTP “send code” payload — UX validation only until routes exist in `/api/v1`. */
export const kycFaydaSendSchema = z.object({
  identifier: z.string().trim().min(8, 'Enter enough characters to identify you').max(72, 'Too long'),
})

export type KycFaydaSendPayload = z.infer<typeof kycFaydaSendSchema>

export const kycFaydaVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{4,8}$/, 'Enter the numeric code you received'),
})

export type KycFaydaVerifyPayload = z.infer<typeof kycFaydaVerifySchema>
