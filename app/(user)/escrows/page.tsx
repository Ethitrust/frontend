import { EscrowsListView } from '@/components/escrows/escrows-list-view'

export const metadata = {
  title: 'Escrows — Ethi-Trust',
  description: 'Your escrows.',
}

type Props = {
  searchParams?: Promise<{ status?: string }>
}

export default async function EscrowsListPage({ searchParams }: Props) {
  const q = searchParams ? await searchParams : {}
  return <EscrowsListView status={q.status} />
}
