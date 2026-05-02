import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ escrow_id: string }> }

export async function POST(request: Request, ctx: RouteContext) {
  const { escrow_id } = await ctx.params
  const id = encodeURIComponent(escrow_id)
  return proxyV1PostJson(request, `/api/v1/admin/escrows/${id}/flag`)
}
