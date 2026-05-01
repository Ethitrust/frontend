import { z } from 'zod'

/** Login request body (email + password) */
export const loginPayloadSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
})

export type LoginPayload = z.infer<typeof loginPayloadSchema>
