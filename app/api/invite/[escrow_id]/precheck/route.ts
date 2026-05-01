import type { InvitePrecheckResponse } from '@/lib/types/invite-precheck'

/** Stub precheck — replace with microservice call */
export async function GET(
  _request: Request,
  context: { params: Promise<{ escrow_id: string }> },
) {
  const { escrow_id } = await context.params

  const body: InvitePrecheckResponse = {
    escrow_id,
    escrow_title: 'B2B shipment — pending acceptance',
    currency: 'ETB',
    amount_display: '—',
    invitee_role: 'seller',
    authenticated: false,
    requirements: {
      needs_registration: true,
      needs_email_verification: false,
      needs_kyc: true,
    },
  }

  return Response.json(body)
}
