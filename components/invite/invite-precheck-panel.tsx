'use client'

import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { InvitePrecheckResponse } from '@/lib/types/invite-precheck'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export function InvitePrecheckPanel({
  escrowId,
  className,
}: {
  escrowId: string
  className?: string
}) {
  const e = ethitrustThemeTokens
  const [data, setData] = useState<InvitePrecheckResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(
          `/api/invite/${encodeURIComponent(escrowId)}/precheck`,
          { cache: 'no-store' },
        )
        const json: unknown = await res.json().catch(() => null)
        if (!res.ok || !json || typeof json !== 'object') {
          throw new Error('Could not load invitation.')
        }
        if (!cancelled) setData(json as InvitePrecheckResponse)
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [escrowId])

  if (error) {
    return (
      <Card
        className={cn('w-full max-w-lg border-border shadow-sm', className)}
      >
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5 shrink-0" aria-hidden />
            <CardTitle className="text-lg font-semibold">
              Invitation unavailable
            </CardTitle>
          </div>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-border pt-6">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Back home</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card
        className={cn(
          'flex w-full max-w-lg flex-col items-center gap-4 border-border py-16 shadow-sm',
          className,
        )}
      >
        <Spinner className="size-8 text-accent" />
        <p className="text-sm text-muted-foreground">Loading invitation…</p>
      </Card>
    )
  }

  const { requirements } = data
  const allClear =
    data.authenticated &&
    !requirements.needs_registration &&
    !requirements.needs_email_verification &&
    !requirements.needs_kyc

  const rows: { ok: boolean; label: string; detail: string }[] = [
    {
      ok: data.authenticated && !requirements.needs_registration,
      label: 'Ethi-Trust account',
      detail:
        !data.authenticated || requirements.needs_registration
          ? 'Create an account or sign in with the invited email.'
          : 'Signed in.',
    },
    {
      ok: data.authenticated && !requirements.needs_email_verification,
      label: 'Verified email',
      detail: !data.authenticated
        ? 'Sign in to continue verification.'
        : requirements.needs_email_verification
          ? 'Confirm your email from the verification link we sent.'
          : 'Email verified.',
    },
    {
      ok: data.authenticated && !requirements.needs_kyc,
      label: 'KYC',
      detail: !data.authenticated
        ? 'Sign in to see your verification status.'
        : requirements.needs_kyc
          ? 'Complete identity verification before accepting this escrow.'
          : 'Verification sufficient for this escrow.',
    },
  ]

  return (
    <Card className={cn('w-full max-w-lg border-border shadow-sm', className)}>
      <CardHeader className="gap-2">
        <p className={e.typography.eyebrow}>Escrow invitation</p>
        <CardTitle className={cn(e.typography.displayLG, 'font-serif font-normal')}>
          {data.escrow_title}
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          You&apos;ve been invited as the{' '}
          <span className="font-medium text-foreground">{data.invitee_role}</span>.
          Complete the checklist below before accepting on the escrow page.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3">
        <div className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Escrow ID</span>
          <p className="mt-1 font-mono text-xs text-foreground">{data.escrow_id}</p>
        </div>

        <ul className="grid gap-3 pt-2">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex gap-3 rounded-xl border border-border bg-background px-4 py-3"
            >
              {row.ok ? (
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-accent"
                  aria-hidden
                />
              ) : (
                <AlertCircle
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              )}
              <div>
                <p className="font-medium leading-tight">{row.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {row.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap">
        {(!data.authenticated || requirements.needs_registration) && (
          <>
            <Button asChild className="rounded-full">
              <Link href={`/signup?next=/invite/${encodeURIComponent(escrowId)}`}>
                Create account
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/signin?next=/invite/${encodeURIComponent(escrowId)}`}>
                Sign in
              </Link>
            </Button>
          </>
        )}
        {data.authenticated && requirements.needs_email_verification && (
          <Button asChild variant="secondary" className="rounded-full">
            <Link href="/verify-email">Verify email</Link>
          </Button>
        )}
        {data.authenticated && requirements.needs_kyc && (
          <Button asChild variant="secondary" className="rounded-full">
            <Link href="/kyc">Complete KYC</Link>
          </Button>
        )}
        {allClear && (
          <Button asChild className="rounded-full">
            <Link href={`/escrows/${encodeURIComponent(escrowId)}`}>
              Continue to escrow
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
