import { proxyV1GetJson, proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/org-escrows` (forward query string). */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const qs = url.searchParams.toString()
  const path = qs ? `/api/v1/org-escrows?${qs}` : '/api/v1/org-escrows'
  return proxyV1GetJson(request, path)
}

/** BFF for `POST /api/v1/org-escrows` (forwards optional `X-Idempotency-Key`). */
export async function POST(request: Request) {
  return proxyV1PostJson(request, '/api/v1/org-escrows')
}
