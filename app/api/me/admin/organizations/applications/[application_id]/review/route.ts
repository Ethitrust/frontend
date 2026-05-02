import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ application_id: string }> }

export async function POST(request: Request, ctx: RouteContext) {
  const { application_id } = await ctx.params
  const id = encodeURIComponent(application_id)
  return proxyV1PostJson(request, `/api/v1/admin/organizations/applications/${id}/review`)
}
