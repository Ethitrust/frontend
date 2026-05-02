import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = {
  params: Promise<{ user_id: string }>
}

export async function GET(request: Request, ctx: RouteContext) {
  const { user_id } = await ctx.params
  const id = encodeURIComponent(user_id)
  return proxyV1GetJson(request, `/api/v1/admin/kyc/${id}/cross-check`)
}
