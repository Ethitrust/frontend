'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchMeOrganizations, postOrganizationSubscribe, postOrganizationSubscribeVerify } from '@/lib/organizations/me-organizations-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

export function OrgWorkspaceAccessGate({ orgId, children }: { orgId: string; children: React.ReactNode }) {
  const e = ethitrustThemeTokens
  const accessToken = useAuthStore((s) => s.accessToken)
  const router = useRouter()
  const searchParams = useSearchParams()

  const orgsQuery = useQuery({
    queryKey: ['me', 'organizations'],
    queryFn: () => fetchMeOrganizations(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  })

  const txRef = searchParams?.get('tx_ref')

  const verifyMutation = useMutation({
    mutationFn: async (ref: string) => {
      return postOrganizationSubscribeVerify(accessToken!, orgId, ref)
    },
    onSuccess: () => {
      toast.success('Subscription activated! Welcome to your workspace.')
      router.replace(`/org/${orgId}/dashboard`)
      void orgsQuery.refetch()
    },
    onError: (error) => {
      toast.error('Payment verification failed. Please try again or contact support.')
      console.error(error)
      router.replace(`/org/${orgId}/dashboard`)
    },
  })

  useEffect(() => {
    if (txRef && !verifyMutation.isPending && !verifyMutation.isSuccess) {
      verifyMutation.mutate(txRef)
    }
  }, [txRef, verifyMutation])

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      return postOrganizationSubscribe(accessToken!, orgId)
    },
    onSuccess: (data) => {
      window.location.href = data.payment_url
    },
    onError: (error) => {
      toast.error('Could not initialize payment. Please try again.')
      console.error(error)
    },
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

  if (orgsQuery.isPending || verifyMutation.isPending) {
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

  const org = orgsQuery.data?.find((o) => o.id === orgId)
  if (!org) {
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

  if (org.status === 'pending_payment') {
    return (
      <div className={cn(e.layout.container, 'py-16')}>
        <Card className="mx-auto max-w-lg border-blue-500/20 shadow-sm">
          <CardHeader className="bg-blue-500/5">
            <CardTitle className="text-base font-semibold">Subscription Required</CardTitle>
            <CardDescription>
              Your organization application has been approved! To activate your organization workspace and start using Ethi-Trust for business, you must set up your monthly subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Business Plan</span>
                <span className="font-semibold">2,500 Birr / month</span>
              </div>
              <p className="text-xs text-muted-foreground">Includes unlimited Escrow-as-a-Service APIs and advanced dispute resolution support.</p>
            </div>
            
            <Button 
              className="w-full rounded-full" 
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to Chapa...
                </>
              ) : (
                'Pay Subscription & Activate'
              )}
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
