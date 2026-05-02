import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/admin/audit-logs?page=&page_size=`. */

export async function GET(request: Request) {
  const url = new URL(request.url)
  const qs = url.searchParams.toString()
  return proxyV1GetJson(request, `/api/v1/admin/audit-logs${qs ? `?${qs}` : ''}`)
}
