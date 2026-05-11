/** Role strings from backend `GET /api/v1/auth/me` (`role`). */

export function isPlatformAdminRole(role: string | null | undefined): boolean {
  if (!role) return false
  const n = role.trim().toLowerCase()
  return n === 'admin' || n === 'superadmin'
}

export function isPlatformModeratorOrAdminRole(role: string | null | undefined): boolean {
  if (!role) return false
  const n = role.trim().toLowerCase()
  return n === 'admin' || n === 'superadmin' || n === 'moderator'
}
