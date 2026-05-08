import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ task_id: string }> }

/** BFF for `GET /api/v1/kyc/fayda/tasks/{task_id}`. */
export async function GET(request: Request, ctx: RouteContext) {
  const { task_id } = await ctx.params
  return proxyV1GetJson(request, `/api/v1/kyc/fayda/tasks/${encodeURIComponent(task_id)}`)
}
