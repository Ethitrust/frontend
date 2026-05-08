'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AuthState = {
  accessToken: string | null
  tokenType: string | null
  setTokens: (accessToken: string, tokenType?: string | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      tokenType: null,
      setTokens: (accessToken, tokenType = 'bearer') =>
        set({
          accessToken,
          tokenType: tokenType ?? 'bearer',
        }),
      clearSession: () => set({ accessToken: null, tokenType: null }),
    }),
    {
      name: 'ethitrust-auth-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        tokenType: state.tokenType,
      }),
    },
  ),
)
