/** Pure display helpers for escrow tables (safe to import from Client Components). */

export type EscrowListStatusBadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

export function escrowListStatusBadgeVariant(status: string): EscrowListStatusBadgeVariant {
  if (status === 'active') return 'secondary'
  if (status === 'completed') return 'outline'
  if (status === 'invited') return 'outline'
  if (status === 'pending_funding') return 'default'
  return 'outline'
}

/** Title-case status / filter key for display (e.g. pending_funding → Pending Funding). */
export function escrowListStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
