import { proxyV1Delete } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ org_id: string, invite_id: string }> }

export async function DELETE(request: Request, ctx: RouteContext) {
  const { org_id, invite_id } = await ctx.params
  return proxyV1Delete(request, `/api/v1/organizations/${encodeURIComponent(org_id)}/invites/${encodeURIComponent(invite_id)}`)
}
