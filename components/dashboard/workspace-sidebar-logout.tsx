'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

export function WorkspaceSidebarLogout({
  className,
  onAfterLogout,
}: {
  className?: string
  onAfterLogout?: () => void
}) {
  const router = useRouter()
  const clearSession = useAuthStore((s) => s.clearSession)

  function logout() {
    clearSession()
    onAfterLogout?.()
    router.replace('/signin')
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className ?? 'w-full justify-start gap-2 rounded-lg'}
      onClick={logout}
    >
      <LogOut className="size-4 shrink-0 opacity-80" aria-hidden />
      Log out
    </Button>
  )
}
