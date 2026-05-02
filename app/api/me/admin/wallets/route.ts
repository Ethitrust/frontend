import { proxyV1GetJson } from '@/lib/api/proxy-v1'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const qs = url.searchParams.toString()
  return proxyV1GetJson(request, `/api/v1/admin/wallets${qs ? `?${qs}` : ''}`)
}
