import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { CreateOrgEscrowForm } from '@/components/org/create-org-escrow-form'
import { Button } from '@/components/ui/button'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'New org escrow — Ethi-Trust',
  description: 'Create an organization escrow.',
}

export default async function OrgNewEscrowPage({
  params,
}: {
  params: Promise<{ org_id: string }>
}) {
  const { org_id } = await params
  const e = ethitrustThemeTokens

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <Button variant="ghost" size="sm" className="mb-6 rounded-full text-muted-foreground" asChild>
        <Link href={`/org/${org_id}/escrows`}>
          <ArrowLeft className="size-4" />
          Org escrows
        </Link>
      </Button>

      <header className="mb-8 max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Organization</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Create org escrow
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3 max-w-xl')}>
          One-time, milestone, and recurring structures under your organization account.
        </p>
      </header>

      <CreateOrgEscrowForm orgId={org_id} />
    </div>
  )
}
