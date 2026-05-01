import { formatUpstreamJsonError } from './upstream-errors'

const AUTH_PREFIX = '/api/v1/auth'

export function getApiBaseUrl(): string | null {
  const raw = process.env.NEXT_API_URL?.trim()
  if (!raw) {
    return null
  }
  return raw.replace(/\/+$/, '')
}

type AuthSegment = 'register' | 'login' | 'verify-email' | 'resend-verification'

export async function postAuthUpstream(
  segment: AuthSegment,
  body: unknown,
): Promise<Response> {
  const base = getApiBaseUrl()
  if (!base) {
    return Response.json(
      { error: 'Server is not configured (NEXT_API_URL).' },
      { status: 503 },
    )
  }

  let res: Response
  try {
    res = await fetch(`${base}${AUTH_PREFIX}/${segment}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    return Response.json(
      { error: 'Could not reach the API. Check your connection.' },
      { status: 502 },
    )
  }

  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    const text = await res.text()
    return Response.json(
      {
        error: res.ok
          ? 'Unexpected response from API.'
          : text.slice(0, 200) || 'Request failed',
      },
      { status: res.ok ? 502 : res.status },
    )
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON from API.' },
      { status: res.ok ? 502 : res.status },
    )
  }

  if (!res.ok) {
    return Response.json(
      { error: formatUpstreamJsonError(data) },
      { status: res.status },
    )
  }

  return Response.json(data, { status: res.status })
}
