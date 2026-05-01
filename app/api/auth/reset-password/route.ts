import { resetPasswordPayloadSchema } from '@/lib/validators/reset-password'

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = resetPasswordPayloadSchema.safeParse(json)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    return Response.json(
      { error: 'Validation failed', fieldErrors: flat.fieldErrors },
      { status: 422 },
    )
  }

  /* Validate token and update password in backend */
  return Response.json({
    ok: true as const,
    message: 'Password updated. You can sign in with your new password.',
  })
}
