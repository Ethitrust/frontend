import { z } from 'zod'

export const organizationApplySchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Use a short URL-safe slug (lowercase letters, numbers, hyphen). Example: acme-trade-fabric',
  }),
  tin: z.string().trim().min(3).max(64),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(1).max(20),
  address: z.string().trim().min(1).max(512),
})

export type OrganizationApplyFormValues = z.infer<typeof organizationApplySchema>
