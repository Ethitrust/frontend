'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

export function WalletPaymentsGate(props: {
  title: string
  description: string
  children: (accessToken: string) => ReactNode
}) {
  const token = useAuthStore((s) => s.accessToken)
  const e = ethitrustThemeTokens

  if (!token) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Payments</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            {props.title}
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>{props.description}</p>
        </header>
        <Card className="mt-10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sign in required</CardTitle>
            <CardDescription>
              Sign in to see your balances, deposit and withdraw funds, and review recent activity.
            </CardDescription>
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

  return <>{props.children(token)}</>
}
