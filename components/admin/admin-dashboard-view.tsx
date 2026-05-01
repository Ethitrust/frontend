'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAuthMe } from '@/lib/auth/me-session-api'
import { isPlatformAdminRole } from '@/lib/auth/roles'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

export function AdminDashboardView() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const e = ethitrustThemeTokens

  const meQuery = useQuery({
    queryKey: ['me', 'auth', 'me'],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
  })

  useEffect(() => {
    if (meQuery.isSuccess && !isPlatformAdminRole(meQuery.data.role)) {
      router.replace('/dashboard')
    }
  }, [meQuery.isSuccess, meQuery.data?.role, router])

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-10')}>
        <Card className="mx-auto max-w-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Admin area</CardTitle>
            <CardDescription>Sign in with an operator account to open the admin dashboard.</CardDescription>
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
            <CardDescription>{meQuery.error?.message ?? 'Try again from the workspace.'}</CardDescription>
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

  if (!isPlatformAdminRole(meQuery.data.role)) {
    return (
      <div className={cn(e.layout.container, 'py-8')}>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    )
  }

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-10')}>
      <header className="max-w-3xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Admin</p>
        <h1
          className={cn(e.typography.displayLG, 'mt-2 flex items-center gap-3 font-serif font-normal text-foreground')}
        >
          <LayoutDashboard className="size-8 shrink-0 opacity-80" aria-hidden />
          Platform dashboard
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Placeholder workspace for operators. Signed in as {meQuery.data.name} ({meQuery.data.email}) — role{' '}
          <span className="font-medium text-foreground">{meQuery.data.role}</span>.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['Users', 'KYC queue', 'Organizations'].map((label) => (
          <Card key={label} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{label}</CardTitle>
              <CardDescription>Coming soon.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Dummy metric cards will connect to admin APIs.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
