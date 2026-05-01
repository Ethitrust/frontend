import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string; wallet_id: string }> }

/** BFF `POST /api/v1/organizations/{org_id}/wallets/{wallet_id}/withdraw` */
export async function POST(request: Request, ctx: RouteContext) {
  const { org_id, wallet_id } = await ctx.params
  return proxyV1PostJson(
    request,
    `/api/v1/organizations/${encodeURIComponent(org_id)}/wallets/${encodeURIComponent(wallet_id)}/withdraw`,
  )
}
