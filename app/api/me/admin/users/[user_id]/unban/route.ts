import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = {
  params: Promise<{ user_id: string }>
}

export async function POST(request: Request, ctx: RouteContext) {
  const { user_id } = await ctx.params
  const id = encodeURIComponent(user_id)
  return proxyV1PostJson(request, `/api/v1/admin/users/${id}/unban`)
}
