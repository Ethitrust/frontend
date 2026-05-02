import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ application_id: string }> }

/** BFF for `GET /api/v1/admin/organizations/applications/{application_id}`. */

export async function GET(request: Request, ctx: RouteContext) {
  const { application_id } = await ctx.params
  const id = encodeURIComponent(application_id)
  return proxyV1GetJson(request, `/api/v1/admin/organizations/applications/${id}`)
}
