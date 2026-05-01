'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import type { OrgEscrowListItem } from '@/lib/org-escrows/org-escrow-types'
import {
  escrowListStatusBadgeVariant,
  escrowListStatusLabel,
} from '@/lib/escrows/escrow-table-display'
import { formatEscrowDate, formatEscrowMoney } from '@/lib/escrows/format-escrow'
import { cn } from '@/lib/utils'

function OrgEscrowRowShell({
  orgId,
  escrowId,
  title,
  children,
}: {
  orgId: string
  escrowId: string
  title: string
  children: ReactNode
}) {
  const router = useRouter()
  const href = `/org/${orgId}/escrows/${escrowId}`

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Open org escrow: ${title}`}
      className={cn(
        'border-b border-border/60 transition-colors last:border-0',
        'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(href)
        }
      }}
    >
      {children}
    </tr>
  )
}

export function ClickableOrgEscrowRow({ orgId, row }: { orgId: string; row: OrgEscrowListItem }) {
  return (
    <OrgEscrowRowShell orgId={orgId} escrowId={row.escrow_id} title={row.title}>
      <td className="px-6 py-3">
        <span className="font-medium text-foreground">{row.title}</span>
        <p className="mt-0.5 text-xs text-muted-foreground">Updated {formatEscrowDate(row.updated_at)}</p>
      </td>
      <td className="px-4 py-3">
        <Badge variant={escrowListStatusBadgeVariant(row.status)}>
          {escrowListStatusLabel(row.status)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{row.receiver_email}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatEscrowMoney(row.funded_amount, row.currency)}</td>
      <td className="px-6 py-3 text-right tabular-nums">{formatEscrowMoney(row.amount, row.currency)}</td>
    </OrgEscrowRowShell>
  )
}
