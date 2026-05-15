import { proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `POST /api/v1/admin/risk/users/{userId}/unrestrict`. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  return proxyV1PostJson(request, `/api/v1/admin/risk/users/${userId}/unrestrict`)
}
