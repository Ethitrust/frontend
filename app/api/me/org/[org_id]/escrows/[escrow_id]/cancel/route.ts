import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string; escrow_id: string }> }

/** BFF for `POST /api/v1/organizations/{org_id}/escrows/{escrow_id}/cancel`. */
export async function POST(request: Request, ctx: RouteContext) {
  const { org_id, escrow_id } = await ctx.params
  return proxyV1PostJson(
    request,
    `/api/v1/organizations/${encodeURIComponent(org_id)}/escrows/${encodeURIComponent(escrow_id)}/cancel`,
  )
}
