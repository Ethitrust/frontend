import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type Ctx = { params: Promise<{ dispute_id: string }> }

/** BFF for `GET /api/v1/disputes/{dispute_id}`. */
export async function GET(request: Request, context: Ctx) {
  const { dispute_id } = await context.params
  return proxyV1GetJson(request, `/api/v1/disputes/${encodeURIComponent(dispute_id)}`)
}
