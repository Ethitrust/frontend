import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/**
 * BFF for `GET /api/v1/wallets/{wallet_id}/transactions`
 * query: page (default 1), page_size (default 20, max 100)
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ wallet_id: string }> },
) {
  const { wallet_id } = await context.params
  const upstream = new URL(request.url)

  const page = upstream.searchParams.get('page') ?? '1'
  const pageSize = upstream.searchParams.get('page_size') ?? '20'

  const q = new URLSearchParams()
  q.set('page', page)
  q.set('page_size', pageSize)

  return proxyV1GetJson(
    request,
    `/api/v1/wallets/${encodeURIComponent(wallet_id)}/transactions?${q.toString()}`,
  )
}
