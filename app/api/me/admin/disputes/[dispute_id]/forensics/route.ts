import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ dispute_id: string }> }

export async function GET(request: Request, ctx: RouteContext) {
  const { dispute_id } = await ctx.params
  const id = encodeURIComponent(dispute_id)
  return proxyV1GetJson(request, `/api/v1/admin/disputes/${id}/forensics`)
}
