/** Types matching OpenAPI-style responses in frontend/docs/apidoc.md */

export type LoginSuccess = {
  access_token: string
  token_type: string
}

export type RegisterUser = {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: string
  banned: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}
