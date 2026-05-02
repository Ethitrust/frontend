import { proxyV1GetJson, proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `GET/POST /api/v1/admin/support-cases`. */

export async function GET(request: Request) {
  const url = new URL(request.url)
  const qs = url.searchParams.toString()
  return proxyV1GetJson(request, `/api/v1/admin/support-cases${qs ? `?${qs}` : ''}`)
}

export async function POST(request: Request) {
  return proxyV1PostJson(request, '/api/v1/admin/support-cases')
}
