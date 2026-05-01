import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ escrow_id: string }> }

/** BFF for `POST /api/v1/org-escrows/{escrow_id}/resend`. */
export async function POST(request: Request, ctx: RouteContext) {
  const { escrow_id } = await ctx.params
  return proxyV1PostJson(request, `/api/v1/org-escrows/${encodeURIComponent(escrow_id)}/resend`)
}
