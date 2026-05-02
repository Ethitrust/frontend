import { AdminKycSubmissionDetailRoutedPage } from '@/components/admin/admin-people-routed-pages'

type Props = { params: Promise<{ submission_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { submission_id } = await params
  return {
    title: `KYC submission ${submission_id} — Ethi-Trust Admin`,
    description: 'Manual KYC submission review.',
  }
}

export default async function AdminKycSubmissionDetailPage({ params }: Props) {
  const { submission_id } = await params
  const id = decodeURIComponent(submission_id)
  return <AdminKycSubmissionDetailRoutedPage submissionId={id} />
}
