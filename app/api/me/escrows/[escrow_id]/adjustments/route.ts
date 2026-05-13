import { proxyV1GetJson, proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ escrow_id: string }> }

export async function GET(request: Request, ctx: RouteContext) {
  const { escrow_id } = await ctx.params
  return proxyV1GetJson(request, `/api/v1/escrows/${encodeURIComponent(escrow_id)}/adjustments`)
}

export async function POST(request: Request, ctx: RouteContext) {
  const { escrow_id } = await ctx.params
  return proxyV1PostJson(request, `/api/v1/escrows/${encodeURIComponent(escrow_id)}/adjustments`)
}
