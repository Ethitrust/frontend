import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string; escrow_id: string }> }

/**
 * BFF for `GET /api/v1/organizations/{org_id}/escrows/{escrow_id}/detail` —
 * UI-friendly detail (progress, risk flags, next action, latest event).
 */
export async function GET(request: Request, ctx: RouteContext) {
  const { org_id, escrow_id } = await ctx.params
  return proxyV1GetJson(
    request,
    `/api/v1/organizations/${encodeURIComponent(org_id)}/escrows/${encodeURIComponent(escrow_id)}/detail`,
  )
}
