'use client'

import Link from 'next/link'
import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import type { AuthMeRow } from '@/lib/auth/auth-session-types'
import { fetchAuthMe } from '@/lib/auth/me-session-api'
import { isPlatformModeratorOrAdminRole } from '@/lib/auth/roles'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

export function ModeratorOperatorGate({
  children,
}: {
  children: (ctx: { accessToken: string; me: AuthMeRow }) => ReactNode
}) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const e = ethitrustThemeTokens

  const meQuery = useQuery({
    queryKey: ['me', 'auth', 'me'],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
  })

  useEffect(() => {
    if (meQuery.isSuccess && !isPlatformModeratorOrAdminRole(meQuery.data.role)) {
      router.replace('/dashboard')
    }
  }, [meQuery.isSuccess, meQuery.data?.role, router])

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-10')}>
        <Card className="mx-auto max-w-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Moderator area</CardTitle>
            <CardDescription>Sign in with a moderator or admin account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full">
              <Link href="/signin">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (meQuery.isPending) {
    return (
      <div className={cn(e.layout.container, 'space-y-4 py-8')}>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    )
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <div className={cn(e.layout.container, 'py-10')}>
        <Card className="mx-auto max-w-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Could not verify access</CardTitle>
            <CardDescription>
              {meQuery.error instanceof Error ? meQuery.error.message : 'Try again from the workspace.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isPlatformModeratorOrAdminRole(meQuery.data.role)) {
    return (
      <div className={cn(e.layout.container, 'py-8')}>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    )
  }

  return <>{children({ accessToken, me: meQuery.data })}</>
}
