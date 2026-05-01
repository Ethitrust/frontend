import { Suspense } from 'react'

import { OrgEscrowsListView } from '@/components/org/org-escrows-list-view'
import { Spinner } from '@/components/ui/spinner'

export const metadata = {
  title: 'Org escrows — Ethi-Trust',
  description: 'Organization escrows.',
}

type Props = {
  params: Promise<{ org_id: string }>
}

function ListFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Spinner className="size-6" aria-hidden />
      <span className="text-sm">Loading…</span>
    </div>
  )
}

export default async function OrgEscrowsPage({ params }: Props) {
  const { org_id } = await params
  return (
    <Suspense fallback={<ListFallback />}>
      <OrgEscrowsListView orgId={org_id} />
    </Suspense>
  )
}
