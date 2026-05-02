import { proxyV1PatchJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ case_id: string }> }

/** BFF for `PATCH /api/v1/admin/support-cases/{case_id}`. */

export async function PATCH(request: Request, ctx: RouteContext) {
  const { case_id } = await ctx.params
  const id = encodeURIComponent(case_id)
  return proxyV1PatchJson(request, `/api/v1/admin/support-cases/${id}`)
}
