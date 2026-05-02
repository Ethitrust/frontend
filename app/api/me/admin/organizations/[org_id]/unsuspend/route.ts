import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string }> }

export async function POST(request: Request, ctx: RouteContext) {
  const { org_id } = await ctx.params
  const id = encodeURIComponent(org_id)
  return proxyV1PostJson(request, `/api/v1/admin/organizations/${id}/unsuspend`)
}
