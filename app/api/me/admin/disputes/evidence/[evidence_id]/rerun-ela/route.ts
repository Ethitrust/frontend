import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ evidence_id: string }> }

export async function POST(request: Request, ctx: RouteContext) {
  const { evidence_id } = await ctx.params
  const id = encodeURIComponent(evidence_id)
  return proxyV1PostJson(request, `/api/v1/admin/disputes/evidence/${id}/rerun-ela`)
}
