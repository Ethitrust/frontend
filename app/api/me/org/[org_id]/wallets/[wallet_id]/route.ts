import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/organizations/{org_id}/wallets/{wallet_id}` — single org wallet. */
export async function GET(
  request: Request,
  context: { params: Promise<{ org_id: string; wallet_id: string }> },
) {
  const { org_id, wallet_id } = await context.params
  return proxyV1GetJson(
    request,
    `/api/v1/organizations/${encodeURIComponent(org_id)}/wallets/${encodeURIComponent(wallet_id)}`,
  )
}
