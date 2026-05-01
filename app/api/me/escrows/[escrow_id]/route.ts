import { proxyV1GetJson } from '@/lib/api/proxy-v1'

type Ctx = { params: Promise<{ escrow_id: string }> }

/** BFF for `GET /api/v1/escrows/{escrow_id}`. */
export async function GET(request: Request, context: Ctx) {
  const { escrow_id } = await context.params
  return proxyV1GetJson(request, `/api/v1/escrows/${encodeURIComponent(escrow_id)}`)
}
