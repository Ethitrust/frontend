import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string }> }

export async function GET(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  return proxyV1GetJson(request, `/api/v1/organizations/${encodeURIComponent(org_id)}/members`)
}
