import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = {
  params: Promise<{ submission_id: string }>
}

/** BFF for `GET /api/v1/admin/kyc/submissions/{submission_id}`. */

export async function GET(request: Request, ctx: RouteContext) {
  const { submission_id } = await ctx.params
  const id = encodeURIComponent(submission_id)
  return proxyV1GetJson(request, `/api/v1/admin/kyc/submissions/${id}`)
}
