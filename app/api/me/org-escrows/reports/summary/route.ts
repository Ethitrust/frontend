import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/org-escrows/reports/summary`. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const qs = url.searchParams.toString()
  const path = qs
    ? `/api/v1/org-escrows/reports/summary?${qs}`
    : '/api/v1/org-escrows/reports/summary'
  return proxyV1GetJson(request, path)
}
