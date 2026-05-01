import { z } from 'zod'

function numberFromInput(v: unknown) {
  if (v === '' || v === null || v === undefined) return undefined
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const milestoneRowSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().min(1, 'Description is required').max(4000),
  amount: z.preprocess(
    numberFromInput,
    z.number({ invalid_type_error: 'Enter an amount' }).finite().positive('Amount must be greater than 0'),
  ),
  due_date: z.string().trim().min(1, 'Due date is required'),
  inspection_hrs: z.coerce
    .number()
    .int()
    .min(1, 'Use at least 1 hour')
    .max(720, 'Inspection window is too long'),
})

/** POST /api/v1/org-escrows body (no initiator_role in apidoc example). */
export const createOrgEscrowFormSchema = z
  .object({
    invitee_email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    escrow_type: z.enum(['onetime', 'milestone', 'recurring']),
    title: z.string().trim().min(1, 'Title is required').max(300),
    description: z.string().trim().min(1, 'Description is required').max(8000),
    currency: z.string().trim().min(1).max(8),
    amount: z.preprocess(
      numberFromInput,
      z.number({ invalid_type_error: 'Enter an amount' }).finite().positive('Amount must be greater than 0'),
    ),
    acceptance_criteria: z.string().trim().min(1, 'Acceptance criteria are required').max(8000),
    inspection_period: z.coerce
      .number()
      .int()
      .min(1, 'Use at least 1 hour')
      .max(720, 'Inspection period is too long'),
    delivery_date: z.string().trim().min(1, 'Delivery target is required'),
    dispute_window: z.coerce
      .number()
      .int()
      .min(1, 'Use at least 1 hour')
      .max(720, 'Dispute window is too long'),
    who_pays_fees: z.enum(['buyer', 'seller']),
    milestones: z.array(milestoneRowSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.escrow_type !== 'milestone') return
    if (!data.milestones.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add at least one milestone',
        path: ['milestones'],
      })
      return
    }
    const sum = data.milestones.reduce((s, m) => s + m.amount, 0)
    const diff = Math.abs(sum - data.amount)
    if (diff > 0.005) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Milestone amounts should add up to the escrow total',
        path: ['milestones'],
      })
    }
  })

export type CreateOrgEscrowFormValues = z.infer<typeof createOrgEscrowFormSchema>
export type CreateOrgEscrowFormInput = z.input<typeof createOrgEscrowFormSchema>
