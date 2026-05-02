import { AdminOrgApplicationDetailRoutedPage } from '@/components/admin/admin-org-routed-pages'

type Props = { params: Promise<{ application_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { application_id } = await params
  return {
    title: `Application ${application_id} — Ethi-Trust Admin`,
    description: 'Organization application review.',
  }
}

export default async function AdminOrgApplicationDetailPage({ params }: Props) {
  const { application_id } = await params
  const id = decodeURIComponent(application_id)
  return <AdminOrgApplicationDetailRoutedPage applicationId={id} />
}
