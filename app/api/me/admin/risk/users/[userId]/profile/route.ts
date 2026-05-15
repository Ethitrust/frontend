import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/admin/risk/users/{userId}/profile`. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  return proxyV1GetJson(request, `/api/v1/admin/risk/users/${userId}/profile`)
}
