import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type Ctx = { params: Promise<{ dispute_id: string }> }

/** BFF for `POST /api/v1/disputes/{dispute_id}/settlement/confirm`. */
export async function POST(request: Request, context: Ctx) {
  const { dispute_id } = await context.params
  return proxyV1PostJson(
    request,
    `/api/v1/disputes/${encodeURIComponent(dispute_id)}/settlement/confirm`,
  )
}
