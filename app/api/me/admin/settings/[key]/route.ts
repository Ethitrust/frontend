import { proxyV1GetJson, proxyV1PatchJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ key: string }> }

/** BFF for `GET/PATCH /api/v1/admin/settings/{key}`. */

export async function GET(request: Request, ctx: RouteContext) {
  const { key } = await ctx.params
  const k = encodeURIComponent(key)
  return proxyV1GetJson(request, `/api/v1/admin/settings/${k}`)
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const { key } = await ctx.params
  const k = encodeURIComponent(key)
  return proxyV1PatchJson(request, `/api/v1/admin/settings/${k}`)
}
