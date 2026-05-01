'use client'

import * as React from 'react'
import {
  ethitrustThemeTokens,
  type EthitrustThemeTokens,
} from '@/lib/ethitrust-theme'

export type EthitrustThemeContextValue = Readonly<EthitrustThemeTokens>

const EthitrustThemeContext = React.createContext<EthitrustThemeContextValue>(
  ethitrustThemeTokens,
)

export type EthitrustThemeProviderProps = {
  children: React.ReactNode
  /** Deep-merge overrides for experiments or white-label later */
  value?: Partial<EthitrustThemeTokens>
}

function mergeTokens(
  base: EthitrustThemeTokens,
  overrides: Partial<EthitrustThemeTokens>,
): EthitrustThemeTokens {
  return {
    brand: { ...base.brand, ...overrides.brand },
    layout: { ...base.layout, ...overrides.layout },
    typography: { ...base.typography, ...overrides.typography },
    surfaces: { ...base.surfaces, ...overrides.surfaces },
    controls: { ...base.controls, ...overrides.controls },
    composition: { ...base.composition, ...overrides.composition },
  }
}

export function EthitrustThemeProvider({
  children,
  value,
}: EthitrustThemeProviderProps) {
  const merged = React.useMemo(
    () =>
      value ? mergeTokens(ethitrustThemeTokens, value) : ethitrustThemeTokens,
    [value],
  )

  return (
    <EthitrustThemeContext.Provider value={merged}>
      {children}
    </EthitrustThemeContext.Provider>
  )
}

export function useEthitrustTheme(): EthitrustThemeContextValue {
  return React.useContext(EthitrustThemeContext)
}
