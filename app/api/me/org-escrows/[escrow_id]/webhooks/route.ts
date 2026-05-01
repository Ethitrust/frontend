import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ escrow_id: string }> }

/** BFF for `GET /api/v1/org-escrows/{escrow_id}/webhooks`. */
export async function GET(request: Request, ctx: RouteContext) {
  const { escrow_id } = await ctx.params
  return proxyV1GetJson(request, `/api/v1/org-escrows/${encodeURIComponent(escrow_id)}/webhooks`)
}
