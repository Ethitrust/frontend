import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/notifications` (page, page_size, unread_only). */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = url.searchParams.get('page') ?? '1'
  const pageSize = url.searchParams.get('page_size') ?? '20'
  const unreadOnly = url.searchParams.get('unread_only') ?? 'false'
  const qs = [
    `page=${encodeURIComponent(page)}`,
    `page_size=${encodeURIComponent(pageSize)}`,
    `unread_only=${encodeURIComponent(unreadOnly)}`,
  ].join('&')
  return proxyV1GetJson(request, `/api/v1/notifications?${qs}`)
}
