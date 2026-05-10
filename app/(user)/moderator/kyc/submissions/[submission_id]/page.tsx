import { ModeratorKycSubmissionDetailRoutedPage } from '@/components/moderator/moderator-routed-pages'

type Props = { params: Promise<{ submission_id: string }> }

export async function generateMetadata({ params }: Props) {
  const { submission_id } = await params
  return {
    title: `KYC submission ${submission_id} — Ethi-Trust Moderator`,
    description: 'Manual KYC submission review.',
  }
}

export default async function ModeratorKycSubmissionDetailPage({ params }: Props) {
  const { submission_id } = await params
  const id = decodeURIComponent(submission_id)
  return <ModeratorKycSubmissionDetailRoutedPage submissionId={id} />
}
