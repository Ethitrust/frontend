import { z } from 'zod'

/** Sent to the API after reset */
export const resetPasswordPayloadSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(4096),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(128, 'Password is too long'),
})

export type ResetPasswordPayload = z.infer<typeof resetPasswordPayloadSchema>

/** Client form includes confirmation */
export const resetPasswordFormSchema = resetPasswordPayloadSchema
  .omit({ password: true })
  .extend({
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(128, 'Password is too long'),
    password_confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>
