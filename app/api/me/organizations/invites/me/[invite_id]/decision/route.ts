import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ invite_id: string }> }

/**
 * BFF for `POST /api/v1/organizations/invites/me/{invite_id}/decision`.
 * Body: `{ "decision": "accept" | "reject" }`.
 */
export async function POST(request: Request, ctx: RouteContext) {
  const { invite_id } = await ctx.params
  return proxyV1PostJson(
    request,
    `/api/v1/organizations/invites/me/${encodeURIComponent(invite_id)}/decision`,
  )
}
