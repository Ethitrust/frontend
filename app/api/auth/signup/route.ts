import { postAuthUpstream } from '@/lib/api/auth-upstream'
import { signupPayloadSchema } from '@/lib/validators/signup'

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = signupPayloadSchema.safeParse(json)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    return Response.json(
      {
        error: 'Validation failed',
        fieldErrors: flat.fieldErrors,
      },
      { status: 422 },
    )
  }

  return postAuthUpstream('register', parsed.data, request)
}
