import { z } from 'zod'

/** Fayda OTP “send code” payload. Backend accepts FAN/FIN values as `fan_or_fin`. */
export const kycFaydaSendSchema = z.object({
  identifier: z.string().trim().min(12, 'Enter a valid FAN or FIN').max(32, 'Too long'),
})

export type KycFaydaSendPayload = z.infer<typeof kycFaydaSendSchema>

export const kycFaydaVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{4,8}$/, 'Enter the numeric code you received'),
})

export type KycFaydaVerifyPayload = z.infer<typeof kycFaydaVerifySchema>
