import { proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF `POST /api/v1/org-escrows/webhooks/test` — fire a test ping */
export async function POST(request: Request) {
  return proxyV1PostJson(request, '/api/v1/org-escrows/webhooks/test')
}
