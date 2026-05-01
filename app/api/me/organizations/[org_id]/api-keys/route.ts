import { proxyV1GetJson, proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string }> }

/** BFF `GET/POST /api/v1/organizations/{org_id}/api-keys` */
export async function GET(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  return proxyV1GetJson(request, `/api/v1/organizations/${encodeURIComponent(org_id)}/api-keys`)
}

export async function POST(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  return proxyV1PostJson(request, `/api/v1/organizations/${encodeURIComponent(org_id)}/api-keys`)
}
