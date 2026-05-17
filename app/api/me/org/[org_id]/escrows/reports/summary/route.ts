import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string }> }

/**
 * BFF for `GET /api/v1/organizations/{org_id}/escrows/reports/summary`.
 * Forwards `date_from` and `date_to` query params (both ISO 8601).
 */
export async function GET(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  const incoming = new URL(request.url)
  const qs = incoming.searchParams.toString()
  const path = `/api/v1/organizations/${encodeURIComponent(org_id)}/escrows/reports/summary${qs ? `?${qs}` : ''}`
  return proxyV1GetJson(request, path)
}
