import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ escrow_id: string }> }

const SIMPLE_ACTIONS = new Set(['accept', 'reject', 'resend', 'cancel', 'submit', 'complete'])
const BODY_ACTIONS = new Set(['counter', 'review', 'dispute'])

/** BFF for participant escrow actions under `POST /api/v1/escrows/{id}/{action}`. */
export async function POST(request: Request, ctx: RouteContext) {
  const { escrow_id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const action = typeof body?.action === 'string' ? body.action : ''

  if (!SIMPLE_ACTIONS.has(action) && !BODY_ACTIONS.has(action)) {
    return Response.json({ error: 'Unsupported escrow action.' }, { status: 400 })
  }

  const upstreamRequest = BODY_ACTIONS.has(action)
    ? new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body.payload ?? {}),
      })
    : new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: '{}',
      })

  return proxyV1PostJson(
    upstreamRequest,
    `/api/v1/escrows/${encodeURIComponent(escrow_id)}/${action}`,
  )
}
