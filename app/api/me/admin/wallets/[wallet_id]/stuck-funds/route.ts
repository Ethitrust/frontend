import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ wallet_id: string }> }

export async function GET(request: Request, ctx: RouteContext) {
  const { wallet_id } = await ctx.params
  return proxyV1GetJson(request, `/api/v1/admin/wallets/${encodeURIComponent(wallet_id)}/stuck-funds`)
}
