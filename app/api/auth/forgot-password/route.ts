import { forgotPasswordPayloadSchema } from '@/lib/validators/forgot-password'

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = forgotPasswordPayloadSchema.safeParse(json)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    return Response.json(
      { error: 'Validation failed', fieldErrors: flat.fieldErrors },
      { status: 422 },
    )
  }

  /* Queue reset email — response is generic to avoid account enumeration */
  return Response.json({
    ok: true as const,
    message:
      'If an account exists for that email, we sent a link to reset your password.',
  })
}
