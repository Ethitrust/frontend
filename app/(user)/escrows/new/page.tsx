import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { CreateEscrowForm } from '@/components/escrows/create-escrow-form'
import { Button } from '@/components/ui/button'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'New escrow — Ethi-Trust',
  description: 'Create an escrow.',
}

export default function NewEscrowPage() {
  const e = ethitrustThemeTokens

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <Button variant="ghost" size="sm" className="mb-6 rounded-full text-muted-foreground" asChild>
        <Link href="/escrows">
          <ArrowLeft className="size-4" />
          All escrows
        </Link>
      </Button>

      <header className="mb-8 max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Transact</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Create escrow
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3 max-w-xl')}>
          One-time, milestone, and recurring structures. Invite your counterparty by email and lock in
          acceptance criteria before funds move.
        </p>
      </header>

      <CreateEscrowForm />
    </div>
  )
}
