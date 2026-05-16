import { z } from 'zod'

export const orgInviteDecisionSchema = z.object({
  org_id: z.string().uuid(),
  invitation_token: z.string().min(1),
})

export type OrgInviteDecisionFormValues = z.infer<typeof orgInviteDecisionSchema>
