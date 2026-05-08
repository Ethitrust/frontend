import { proxyV1PostJson } from '@/lib/api/proxy-v1'

type RouteContext = { params: Promise<{ escrow_id: string; milestone_id: string }> }

const ACTIONS = new Set(['deliver', 'approve'])

/** BFF for milestone actions under `POST /api/v1/escrows/{id}/milestones/{mid}/{action}`. */
export async function POST(request: Request, ctx: RouteContext) {
  const { escrow_id, milestone_id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const action = typeof body?.action === 'string' ? body.action : ''

  if (!ACTIONS.has(action)) {
    return Response.json({ error: 'Unsupported milestone action.' }, { status: 400 })
  }

  const upstreamRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: '{}',
  })

  return proxyV1PostJson(
    upstreamRequest,
    `/api/v1/escrows/${encodeURIComponent(escrow_id)}/milestones/${encodeURIComponent(
      milestone_id,
    )}/${action}`,
  )
}
