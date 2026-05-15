import { proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `POST /api/v1/admin/risk/circular-flows/{detectionId}/investigate?admin_id=`. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ detectionId: string }> }
) {
  const { detectionId } = await params
  const url = new URL(request.url)
  const adminId = url.searchParams.get('admin_id')
  
  return proxyV1PostJson(
    request, 
    `/api/v1/admin/risk/circular-flows/${detectionId}/investigate${adminId ? `?admin_id=${adminId}` : ''}`
  )
}
