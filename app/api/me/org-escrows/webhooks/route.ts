import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF `GET /api/v1/org-escrows/webhooks` — org-wide delivery log */
export async function GET(request: Request) {
  return proxyV1GetJson(request, '/api/v1/org-escrows/webhooks')
}
