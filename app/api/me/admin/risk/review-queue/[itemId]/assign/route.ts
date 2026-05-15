import { proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `POST /api/v1/admin/risk/review-queue/{itemId}/assign`. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  return proxyV1PostJson(request, `/api/v1/admin/risk/review-queue/${itemId}/assign`)
}
