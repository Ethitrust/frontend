import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ adjustment_id: string }> }

export async function POST(request: Request, ctx: RouteContext) {
  const { adjustment_id } = await ctx.params
  return proxyV1PostJson(request, `/api/v1/escrows/adjustments/${encodeURIComponent(adjustment_id)}/respond`)
}
