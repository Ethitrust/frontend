import { proxyV1Delete } from '@/lib/api/proxy-v1'

type RouteContext = {
  params: Promise<{ org_id: string; api_key_id: string }>
}

/** BFF `DELETE /api/v1/organizations/{org_id}/api-keys/{api_key_id}` */
export async function DELETE(request: Request, ctx: RouteContext) {
  const { org_id, api_key_id } = await ctx.params
  return proxyV1Delete(
    request,
    `/api/v1/organizations/${encodeURIComponent(org_id)}/api-keys/${encodeURIComponent(api_key_id)}`,
  )
}
