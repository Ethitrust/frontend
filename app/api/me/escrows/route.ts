import { proxyV1GetJson, proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/escrows?page=&page_size=`. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = url.searchParams.get('page') ?? '1'
  const pageSize = url.searchParams.get('page_size') ?? '20'
  const qs = `page=${encodeURIComponent(page)}&page_size=${encodeURIComponent(pageSize)}`
  return proxyV1GetJson(request, `/api/v1/escrows?${qs}`)
}

/** BFF for `POST /api/v1/escrows` (initialize escrow). */
export async function POST(request: Request) {
  return proxyV1PostJson(request, '/api/v1/escrows')
}
