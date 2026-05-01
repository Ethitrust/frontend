import { z } from 'zod'

export const disputeMessageSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  message_type: z.enum(['text']).default('text'),
  reply_to_message_id: z.string().uuid().optional().nullable(),
})

export type DisputeMessageFormValues = z.infer<typeof disputeMessageSchema>
