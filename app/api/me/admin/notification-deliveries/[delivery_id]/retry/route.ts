import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ delivery_id: string }> }

/** BFF for `POST /api/v1/admin/notification-deliveries/{delivery_id}/retry`. */

export async function POST(request: Request, ctx: RouteContext) {
  const { delivery_id } = await ctx.params
  const id = encodeURIComponent(delivery_id)
  return proxyV1PostJson(request, `/api/v1/admin/notification-deliveries/${id}/retry`)
}
