import { z } from 'zod'

/** Example from apidoc; UI offers these presets while still matching server validation. */
export const settlementResolutionOutcomes = [
  'release_to_seller',
  'release_to_buyer',
  'refund_buyer',
  'split_funds',
] as const

export const settlementProposeSchema = z.object({
  resolution_outcome: z.enum(settlementResolutionOutcomes),
  note: z.string().trim().max(2000).optional().nullable(),
})

export const settlementConfirmSchema = z.object({
  note: z.string().trim().max(2000).optional().nullable(),
})

export type SettlementProposeFormValues = z.infer<typeof settlementProposeSchema>
export type SettlementConfirmFormValues = z.infer<typeof settlementConfirmSchema>
