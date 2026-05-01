export type InvitePrecheckResponse = {
  escrow_id: string
  escrow_title: string
  currency: string
  amount_display: string
  invitee_role: string
  authenticated: boolean
  requirements: {
    needs_registration: boolean
    needs_email_verification: boolean
    needs_kyc: boolean
  }
}
