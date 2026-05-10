import { z } from 'zod'

export const confirmResetPasswordPayloadSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(4096),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  new_password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(128, 'Password is too long'),
})

export type ConfirmResetPasswordPayload = z.infer<
  typeof confirmResetPasswordPayloadSchema
>

export const confirmResetPasswordFormSchema = confirmResetPasswordPayloadSchema
  .omit({ new_password: true })
  .extend({
    new_password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(128, 'Password is too long'),
    password_confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.new_password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  })

export type ConfirmResetPasswordFormValues = z.infer<
  typeof confirmResetPasswordFormSchema
>
