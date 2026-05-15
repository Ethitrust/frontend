import { proxyV1GetJson, proxyV1PutJson } from '@/lib/api/proxy-v1'

/** BFF for `GET/PUT /api/v1/admin/risk/config`. */
export async function GET(request: Request) {
  return proxyV1GetJson(request, '/api/v1/admin/risk/config')
}

export async function PUT(request: Request) {
  return proxyV1PutJson(request, '/api/v1/admin/risk/config')
}
