import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string }> }

/**
 * BFF for `GET /api/v1/organizations/{org_id}/escrows` — paginated list with filters.
 * Forwards all incoming query params (status, is_active, date_from, date_to, search,
 * page, page_size).
 *
 * NOTE: Org-escrow CREATION is intentionally not exposed on this dashboard
 * surface — organizations create escrows via the public API only. The
 * corresponding upstream `POST /api/v1/organizations/{org_id}/escrows`
 * endpoint has no BFF here.
 */
export async function GET(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  const incoming = new URL(request.url)
  const qs = incoming.searchParams.toString()
  const path = `/api/v1/organizations/${encodeURIComponent(org_id)}/escrows${qs ? `?${qs}` : ''}`
  return proxyV1GetJson(request, path)
}
