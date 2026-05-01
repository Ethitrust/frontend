'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export function ComplianceFlowShell({
  title,
  description,
  backHref = '/kyc',
  backLabel = 'Back to verification overview',
  contentClassName = 'max-w-2xl',
  children,
}: {
  title: string
  description?: ReactNode
  backHref?: string
  backLabel?: string
  contentClassName?: string
  children: ReactNode
}) {
  const e = ethitrustThemeTokens
  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 mb-6 gap-2 text-muted-foreground"
      >
        <Link href={backHref}>
          <ArrowLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>
      </Button>
      <header className="max-w-3xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Compliance</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>{title}</h1>
        {description ? (
          <p className={cn(e.typography.bodyMuted, 'mt-3 max-w-2xl')}>{description}</p>
        ) : null}
      </header>
      <div className={cn('mt-10', contentClassName)}>{children}</div>
    </div>
  )
}
