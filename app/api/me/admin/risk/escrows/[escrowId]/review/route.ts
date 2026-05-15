import { proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `POST /api/v1/admin/risk/escrows/{escrowId}/review?admin_id=`. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ escrowId: string }> }
) {
  const { escrowId } = await params
  const url = new URL(request.url)
  const adminId = url.searchParams.get('admin_id')
  
  return proxyV1PostJson(
    request, 
    `/api/v1/admin/risk/escrows/${escrowId}/review${adminId ? `?admin_id=${adminId}` : ''}`
  )
}
