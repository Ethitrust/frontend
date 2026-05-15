import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/admin/risk/escrows/{escrowId}/risk`. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ escrowId: string }> }
) {
  const { escrowId } = await params
  return proxyV1GetJson(request, `/api/v1/admin/risk/escrows/${escrowId}/risk`)
}
