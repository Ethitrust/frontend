import {
  getApiBaseUrl,
  MISSING_API_BASE_ERROR,
} from '@/lib/api/auth-upstream'
import { formatUpstreamJsonError } from '@/lib/api/upstream-errors'

/** BFF: proxies to real backend `GET /api/v1/escrows/{escrow_id}/invitation/precheck` */
export async function GET(
  request: Request,
  context: { params: Promise<{ escrow_id: string }> },
) {
  const base = getApiBaseUrl()
  if (!base) {
    return Response.json({ error: MISSING_API_BASE_ERROR }, { status: 503 })
  }

  const { escrow_id } = await context.params
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('invitee_email')
  const qs = email ? `?invitee_email=${encodeURIComponent(email)}` : ''
  const url = `${base}/api/v1/escrows/${encodeURIComponent(escrow_id)}/invitation/precheck${qs}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
  } catch {
    return Response.json(
      { error: 'Could not reach the API. Check your connection.' },
      { status: 502 },
    )
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    return Response.json(
      { error: text.slice(0, 280) || 'Unexpected response from API.' },
      { status: res.ok ? 502 : res.status },
    )
  }

  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    return Response.json({ error: formatUpstreamJsonError(data) }, { status: res.status })
  }

  return Response.json(data, { status: res.status })
}
