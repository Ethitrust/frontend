import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF: proxies to real backend `GET /api/v1/escrows/{escrow_id}/invitation/precheck` */
export async function GET(
  request: Request,
  context: { params: Promise<{ escrow_id: string }> },
) {
  const { escrow_id } = await context.params
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('invitee_email')
  const qs = email ? `?invitee_email=${encodeURIComponent(email)}` : ''
  return proxyV1GetJson(
    request,
    `/api/v1/escrows/${encodeURIComponent(escrow_id)}/invitation/precheck${qs}`,
  )
}
