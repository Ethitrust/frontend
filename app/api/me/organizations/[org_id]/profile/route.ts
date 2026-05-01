import { proxyV1GetJson, proxyV1PatchJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string }> }

/** BFF `GET/PATCH /api/v1/organizations/{org_id}/profile` */
export async function GET(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  return proxyV1GetJson(request, `/api/v1/organizations/${encodeURIComponent(org_id)}/profile`)
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  return proxyV1PatchJson(request, `/api/v1/organizations/${encodeURIComponent(org_id)}/profile`)
}
