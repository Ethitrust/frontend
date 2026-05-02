import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ event_id: string }> }

/** BFF for `GET /api/v1/admin/events/{event_id}/payload`. */

export async function GET(request: Request, ctx: RouteContext) {
  const { event_id } = await ctx.params
  const id = encodeURIComponent(event_id)
  return proxyV1GetJson(request, `/api/v1/admin/events/${id}/payload`)
}
