'use client'

import { create } from 'zustand'

type AuthState = {
  accessToken: string | null
  tokenType: string | null
  setTokens: (accessToken: string, tokenType?: string | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  tokenType: null,
  setTokens: (accessToken, tokenType = 'bearer') =>
    set({
      accessToken,
      tokenType: tokenType ?? 'bearer',
    }),
  clearSession: () => set({ accessToken: null, tokenType: null }),
}))
