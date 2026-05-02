/**
 * Normalize FastAPI / OpenAPI error bodies and our BFF `{ error: string }` shape.
 */
export function formatUpstreamJsonError(body: unknown): string {
  if (body === null || typeof body !== 'object') {
    return typeof body === 'string' && body.length > 0 ? body : 'Something went wrong'
  }
  const o = body as Record<string, unknown>
  if ('error' in o && typeof o.error === 'string' && o.error.length > 0) {
    return o.error
  }
  if ('detail' in o) {
    const d = o.detail
    if (Array.isArray(d)) {
      const parts = d.map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg)
        }
        return typeof item === 'string' ? item : ''
      })
      const joined = parts.filter(Boolean).join('. ')
      return joined.length > 0 ? joined : 'Validation failed'
    }
    if (typeof d === 'string' && d.length > 0) {
      return d
    }
    if (d !== null && typeof d === 'object') {
      try {
        const s = JSON.stringify(d)
        if (s.length > 0) return s.length > 600 ? `${s.slice(0, 600)}…` : s
      } catch {
        return 'Request failed (unreadable error detail)'
      }
    }
  }
  if (typeof o.message === 'string' && o.message.length > 0) {
    return o.message
  }
  return 'Something went wrong'
}

function firstFieldErrorMessage(fieldErrors: unknown): string | null {
  if (!fieldErrors || typeof fieldErrors !== 'object') {
    return null
  }
  for (const v of Object.values(fieldErrors)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') {
      return v[0]
    }
    if (
      typeof v === 'object' &&
      v !== null &&
      'formErrors' in v &&
      Array.isArray((v as { formErrors?: unknown }).formErrors) &&
      typeof (v as { formErrors: unknown[] }).formErrors[0] === 'string'
    ) {
      return String((v as { formErrors: string[] }).formErrors[0])
    }
  }
  return null
}

export function getBffErrorMessage(data: unknown, fallback = 'Something went wrong'): string {
  if (typeof data === 'object' && data !== null) {
    const o = data as Record<string, unknown>
    const field = firstFieldErrorMessage(o.fieldErrors)
    if (field) {
      return field
    }
    if (typeof o.error === 'string' && o.error.length > 0) {
      return o.error
    }
  }
  return formatUpstreamJsonError(data) || fallback
}
