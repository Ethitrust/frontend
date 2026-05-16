'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchAuthProfile } from '@/lib/auth/me-session-api'
import { isKycCompleted, presentKycStatus, type KycPresentation } from '@/lib/kyc/kyc-presentation'
import { useAuthStore } from '@/stores/auth-store'

type KycGuardContextValue = {
  /** Raw kyc_status string from the backend profile, or null while loading / unauthenticated. */
  kycStatus: string | null
  /** True only when kyc_status is one of the explicitly verified values. */
  isKycVerified: boolean
  /** True while the profile fetch is still in-flight. */
  isKycLoading: boolean
  /** Presentation object (label / description / badge variant) for UI display. */
  kycPresentation: KycPresentation
}

const KycGuardContext = createContext<KycGuardContextValue>({
  kycStatus: null,
  isKycVerified: false,
  isKycLoading: true,
  kycPresentation: presentKycStatus(null),
})

export function useKycGuard(): KycGuardContextValue {
  return useContext(KycGuardContext)
}

/**
 * Provides centralized KYC status resolution for all child components.
 * Fetches the authenticated user's profile once and caches via react-query.
 */
export function KycGuardProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)

  const profileQuery = useQuery({
    queryKey: ['me', 'auth', 'profile'],
    queryFn: () => fetchAuthProfile(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  })

  const rawStatus = profileQuery.data?.kyc_status ?? null

  const value: KycGuardContextValue = {
    kycStatus: rawStatus,
    isKycVerified: isKycCompleted(rawStatus),
    isKycLoading: profileQuery.isPending && Boolean(accessToken),
    kycPresentation: presentKycStatus(rawStatus),
  }

  return (
    <KycGuardContext.Provider value={value}>
      {children}
    </KycGuardContext.Provider>
  )
}
