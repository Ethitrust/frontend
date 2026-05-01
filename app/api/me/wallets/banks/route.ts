import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/wallets/banks` — forwards query (currency, provider). */
export async function GET(request: Request) {
  const u = new URL(request.url)
  const q = u.searchParams.toString()
  const suffix = q ? `?${q}` : '?currency=ETB&provider=chapa'
  return proxyV1GetJson(request, `/api/v1/wallets/banks${suffix}`)
}
