'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import type { EscrowRow } from '@/lib/escrows/escrow-list-types'

import {
  type EscrowListStatusBadgeVariant,
  escrowListStatusBadgeVariant,
  escrowListStatusLabel,
} from '@/lib/escrows/escrow-table-display'
import { formatEscrowDate, formatEscrowMoney } from '@/lib/escrows/format-escrow'
import { cn } from '@/lib/utils'

function EscrowRowShell({
  escrowId,
  title,
  children,
}: {
  escrowId: string
  title: string
  children: ReactNode
}) {
  const router = useRouter()
  const href = `/escrows/${escrowId}`

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Open escrow: ${title}`}
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

type EscrowsListRowProps = {
  row: EscrowRow
  roleLabel: string
}

export function ClickableEscrowRow({ row, roleLabel }: EscrowsListRowProps) {
  return (
    <EscrowRowShell escrowId={row.id} title={row.title}>
      <td className="px-6 py-3">
        <span className="font-medium text-foreground">{row.title}</span>
        <p className="mt-0.5 text-xs text-muted-foreground">Updated {formatEscrowDate(row.updated_at)}</p>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{roleLabel}</td>
      <td className="px-4 py-3 capitalize text-muted-foreground">
        {row.escrow_type.replace(/_/g, ' ')}
      </td>
      <td className="px-4 py-3">
        <Badge variant={escrowListStatusBadgeVariant(row.status)}>
          {escrowListStatusLabel(row.status)}
        </Badge>
      </td>
      <td className="px-6 py-3 text-right tabular-nums">
        {formatEscrowMoney(row.amount, row.currency)}
      </td>
    </EscrowRowShell>
  )
}

export function EscrowPreviewClickableRow({
  row,
  statusBadgeVariant,
  statusBadgeLabel,
}: {
  row: Pick<
    EscrowListItem,
    'id' | 'title' | 'updated_at' | 'escrow_type' | 'amount' | 'currency'
  >
  statusBadgeVariant: EscrowListStatusBadgeVariant
  statusBadgeLabel: string
}) {
  return (
    <EscrowRowShell escrowId={row.id} title={row.title}>
      <td className="px-6 py-3">
        <span className="font-medium text-foreground">{row.title}</span>
        <p className="mt-0.5 text-xs text-muted-foreground">Updated {formatEscrowDate(row.updated_at)}</p>
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusBadgeVariant}>{statusBadgeLabel}</Badge>
      </td>
      <td className="px-4 py-3 capitalize text-muted-foreground">
        {row.escrow_type.replace(/_/g, ' ')}
      </td>
      <td className="px-6 py-3 text-right tabular-nums">
        {formatEscrowMoney(row.amount, row.currency)}
      </td>
    </EscrowRowShell>
  )
}
