'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchMeOrganizations } from '@/lib/organizations/me-organizations-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

export function OrgWorkspaceAccessGate({ orgId, children }: { orgId: string; children: React.ReactNode }) {
  const e = ethitrustThemeTokens
  const accessToken = useAuthStore((s) => s.accessToken)

  const orgsQuery = useQuery({
    queryKey: ['me', 'organizations'],
    queryFn: () => fetchMeOrganizations(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  })

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, 'py-16')}>
        <Card className="mx-auto max-w-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sign in required</CardTitle>
            <CardDescription>Organization workspaces use your Ethi-Trust session.</CardDescription>
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

  if (orgsQuery.isPending) {
    return (
      <div className={cn(e.layout.container, 'space-y-4 py-16')}>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full max-w-2xl rounded-xl" />
      </div>
    )
  }

  if (orgsQuery.isError) {
    return (
      <div className={cn(e.layout.container, 'py-16')}>
        <Card className="mx-auto max-w-lg border-destructive/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Could not verify organization access</CardTitle>
            <CardDescription>
              {orgsQuery.error instanceof Error ? orgsQuery.error.message : 'Request failed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => void orgsQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const allowed = orgsQuery.data?.some((o) => o.id === orgId) ?? false
  if (!allowed) {
    return (
      <div className={cn(e.layout.container, 'py-16')}>
        <Card className="mx-auto max-w-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">No access to this organization</CardTitle>
            <CardDescription>
              Your account is not listed as a member of this organization. Check the org ID or open an organization
              you belong to from your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-all font-mono text-xs text-muted-foreground">{orgId}</p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
