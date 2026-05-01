import { z } from 'zod'

/** Mirrors the registration payload shape (snake_case) sent to the API */
export const signupPayloadSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(120, 'First name is too long'),
  last_name: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(120, 'Last name is too long'),
  phone_number: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(32)
    .refine((val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length >= 9 && digits.length <= 15
    }, 'Enter a valid phone number'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(128, 'Password is too long'),
})

export type SignupPayload = z.infer<typeof signupPayloadSchema>
