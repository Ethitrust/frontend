'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useKycGuard } from '@/components/kyc/kyc-guard-provider'
import { useAuthStore } from '@/stores/auth-store'

/** sessionStorage key used to persist the user's intended destination through the KYC flow. */
export const KYC_REDIRECT_KEY = 'ethitrust:kyc-redirect'

/**
 * Route patterns that require a VERIFIED kyc_status.
 * Checked with `startsWith` so sub-routes are also gated.
 */
const KYC_PROTECTED_PREFIXES: string[] = [
  // '/escrows/new' is now protected by a visual form overlay instead of a hard redirect
]

/**
 * Returns true if `pathname` is a KYC-protected route.
 * Handles both prefix-based patterns and dynamic `/escrows/[id]` segments.
 */
function isKycProtectedRoute(pathname: string): boolean {
  for (const prefix of KYC_PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return true
    }
  }

  // Match /escrows/[uuid-or-id] but NOT /escrows or /escrows/new (already handled)
  const escrowDetailMatch = /^\/escrows\/(?!new\b)[^/]+/.test(pathname)
  if (escrowDetailMatch) return true

  return false
}

/**
 * Route guard that redirects unverified users away from KYC-protected routes.
 *
 * Placed inside the `(user)` layout, after authentication is resolved.
 * Stores the blocked destination in sessionStorage so the KYC completion
 * view can redirect the user back afterwards.
 */
export function KycRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { isKycVerified, isKycLoading } = useKycGuard()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Don't act until we know the KYC status, or if the user isn't signed in
    if (!accessToken || isKycLoading) return

    if (isKycProtectedRoute(pathname) && !isKycVerified) {
      // Build full target path including search params
      const search = searchParams.toString()
      const fullTarget = search ? `${pathname}?${search}` : pathname
      try {
        sessionStorage.setItem(KYC_REDIRECT_KEY, fullTarget)
      } catch {
        /* sessionStorage may be unavailable in some contexts */
      }
      hasRedirected.current = true
      router.replace('/kyc')
    }
  }, [accessToken, isKycLoading, isKycVerified, pathname, searchParams, router])

  // While auth/KYC status is resolving on a protected route, show a loading state
  if (accessToken && isKycLoading && isKycProtectedRoute(pathname)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking verification status…</p>
        </div>
      </div>
    )
  }

  // If we're about to redirect, prevent flash of protected content
  if (
    accessToken &&
    !isKycLoading &&
    !isKycVerified &&
    isKycProtectedRoute(pathname)
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Redirecting to verification…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
