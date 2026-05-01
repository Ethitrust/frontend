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

export function OrganizationsSessionGate(props: {
  title: string
  description: string
  eyebrow?: string
  children: (accessToken: string) => ReactNode
}) {
  const token = useAuthStore((s) => s.accessToken)
  const e = ethitrustThemeTokens
  const eyebrow = props.eyebrow ?? 'Organization'

  if (!token) {
    return (
      <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>{eyebrow}</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            {props.title}
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>{props.description}</p>
        </header>
        <Card className="mt-10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sign in to continue</CardTitle>
            <CardDescription>
              Business onboarding and team invites use your authenticated Ethi-Trust session.
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
