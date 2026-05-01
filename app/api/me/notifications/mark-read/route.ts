import { proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `POST /api/v1/notifications/mark-read` ({ notification_ids }). */
export async function POST(request: Request) {
  return proxyV1PostJson(request, '/api/v1/notifications/mark-read')
}
