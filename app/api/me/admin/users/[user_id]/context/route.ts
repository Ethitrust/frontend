import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = {
  params: Promise<{ user_id: string }>
}

/** BFF for `GET /api/v1/admin/users/{user_id}/context`. */

export async function GET(request: Request, ctx: RouteContext) {
  const { user_id } = await ctx.params
  const id = encodeURIComponent(user_id)
  return proxyV1GetJson(request, `/api/v1/admin/users/${id}/context`)
}
