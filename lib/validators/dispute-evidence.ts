import { z } from 'zod'

export const disputeEvidenceDescriptionSchema = z.object({
  description: z.string().trim().max(500).optional().nullable(),
})

export type DisputeEvidenceDescriptionValues = z.infer<typeof disputeEvidenceDescriptionSchema>
