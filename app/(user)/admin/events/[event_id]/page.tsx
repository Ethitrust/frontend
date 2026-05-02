import { AdminEventPayloadRoutedPage } from '@/components/admin/admin-messaging-routed-pages'

type Props = { params: Promise<{ event_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { event_id } = await params
  return {
    title: `Event ${event_id} — Ethi-Trust Admin`,
    description: 'Serialized payload for this domain event.',
  }
}

export default async function AdminEventPayloadPage({ params }: Props) {
  const { event_id } = await params
  const id = decodeURIComponent(event_id)
  return <AdminEventPayloadRoutedPage eventId={id} />
}
