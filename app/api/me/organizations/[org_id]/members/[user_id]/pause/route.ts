import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string, user_id: string }> }

export async function POST(request: Request, ctx: RouteContext) {
  const { org_id, user_id } = await ctx.params
  return proxyV1PostJson(request, `/api/v1/organizations/${encodeURIComponent(org_id)}/members/${encodeURIComponent(user_id)}/pause`)
}
