import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string }> }

/**
 * BFF for `GET /api/v1/organizations/{org_id}/escrows/webhooks` — 50 most-recent
 * org-wide webhook deliveries across all escrows.
 */
export async function GET(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  return proxyV1GetJson(
    request,
    `/api/v1/organizations/${encodeURIComponent(org_id)}/escrows/webhooks`,
  )
}
