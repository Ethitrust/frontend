import { proxyV1GetJson } from '@/lib/api/proxy-v1'

/**
 * BFF for `GET /api/v1/organizations/invites/me` — list invitations addressed
 * to the current user. Forwards the optional `status` query param.
 */
export async function GET(request: Request) {
  const incoming = new URL(request.url)
  const qs = incoming.searchParams.toString()
  const path = `/api/v1/organizations/invites/me${qs ? `?${qs}` : ''}`
  return proxyV1GetJson(request, path)
}
