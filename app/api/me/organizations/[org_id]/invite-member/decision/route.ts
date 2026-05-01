import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type Ctx = { params: Promise<{ org_id: string }> }

/** BFF for `POST /api/v1/organizations/{org_id}/invite-member/decision`. */
export async function POST(request: Request, context: Ctx) {
  const { org_id } = await context.params
  return proxyV1PostJson(
    request,
    `/api/v1/organizations/${encodeURIComponent(org_id)}/invite-member/decision`,
  )
}
