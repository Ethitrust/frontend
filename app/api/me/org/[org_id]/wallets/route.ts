import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/organizations/{org_id}/wallets` — list an org's wallets. */
export async function GET(
  request: Request,
  context: { params: Promise<{ org_id: string }> },
) {
  const { org_id } = await context.params
  return proxyV1GetJson(
    request,
    `/api/v1/organizations/${encodeURIComponent(org_id)}/wallets`,
  )
}
