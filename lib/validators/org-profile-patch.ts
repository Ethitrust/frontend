import { z } from 'zod'

/** PATCH `/api/v1/organizations/{org_id}/profile` body (apidoc). */
export const orgProfilePatchSchema = z.object({
  name: z.string(),
  slug: z.string(),
  logo: z.string(),
  email: z.union([z.literal(''), z.string().email()]),
  phone_number: z.string(),
  address: z.string(),
  tin: z.string(),
  webhook_url: z.union([z.literal(''), z.string().url()]),
  webhook_secret: z.string(),
})

export type OrgProfilePatchInput = z.input<typeof orgProfilePatchSchema>
export type OrgProfilePatchValues = z.output<typeof orgProfilePatchSchema>
