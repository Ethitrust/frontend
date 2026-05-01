import type { AuthProfileRow } from '@/lib/auth/auth-session-types'

export type KycPresentation = {
  label: string
  description: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}

/**
 * Normalize `kyc_status` from GET `/api/v1/auth/profile` for UI.
 * Unknown values surface as informational.
 */
export function presentKycStatus(status: string | undefined | null): KycPresentation {
  const raw = (status ?? 'unknown').trim().toLowerCase().replace(/[\s-]+/g, '_')

  switch (raw) {
    case 'approved':
    case 'verified':
    case 'passed':
      return {
        label: 'Verified',
        description: 'Your identity checks look complete based on our latest profile update.',
        variant: 'secondary',
      }
    case 'pending':
    case 'in_review':
    case 'processing':
      return {
        label: 'In review',
        description: 'We are reviewing what you submitted. You will be notified here when status changes.',
        variant: 'outline',
      }
    case 'submitted':
    case 'documents_submitted':
      return {
        label: 'Documents received',
        description: 'Your documents are queued for review.',
        variant: 'outline',
      }
    case 'rejected':
    case 'failed':
    case 'declined':
      return {
        label: 'Rejected',
        description: 'Verification did not succeed. Retry with corrected details or manual upload.',
        variant: 'destructive',
      }
    case '':
    case 'none':
    case 'not_started':
    case 'unverified':
      return {
        label: 'Not verified',
        description: 'Finish email confirmation and identity checks to unlock escrow and wallet restrictions.',
        variant: 'default',
      }
    default:
      return {
        label: status?.replace(/_/g, ' ') || 'Unknown',
        description:
          'We could not map this exact status automatically. Continue with uploads or Fayda flow if instructed by support.',
        variant: 'default',
      }
  }
}

/** Short display line for dashboards (optional reuse). */

export function kycStatusEyebrowLabel(profile: Pick<AuthProfileRow, 'kyc_status'>): string {
  return presentKycStatus(profile.kyc_status).label
}

/** True when escrow-style checks can treat identity as cleared (apidoc `kyc_status` values). */

export function isKycCompleted(status: string | undefined | null): boolean {
  const raw = (status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return raw === 'approved' || raw === 'verified' || raw === 'passed'
}
