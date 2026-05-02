import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/admin/notifications/pipeline-diagnostics`. */

export async function GET(request: Request) {
  return proxyV1GetJson(request, '/api/v1/admin/notifications/pipeline-diagnostics')
}
