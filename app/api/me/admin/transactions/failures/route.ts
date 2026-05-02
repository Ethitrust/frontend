import { proxyV1GetJson } from '@/lib/api/proxy-v1'

export async function GET(request: Request) {
  return proxyV1GetJson(request, '/api/v1/admin/transactions/failures')
}
