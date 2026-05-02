import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = {
  params: Promise<{ submission_id: string }>
}

export async function POST(request: Request, ctx: RouteContext) {
  const { submission_id } = await ctx.params
  const id = encodeURIComponent(submission_id)
  return proxyV1PostJson(request, `/api/v1/admin/kyc/submissions/${id}/review`)
}
