'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { FileStack, Gavel, LayoutDashboard } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function ShortcutCard({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string
  icon: LucideIcon
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground transition-colors hover:bg-muted/60',
      )}
    >
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </Link>
  )
}

const MODERATOR_DESTINATIONS = [
  {
    href: '/moderator/disputes/assigned',
    label: 'Assigned disputes',
    icon: Gavel,
    description: 'Disputes assigned to you for mediation',
  },
  {
    href: '/moderator/kyc/submissions',
    label: 'Manual KYC',
    icon: FileStack,
    description: 'Review identity submission packets',
  },
] as const

export function ModeratorDashboardView() {
  const e = ethitrustThemeTokens

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-10')}>
      <header className="max-w-3xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Moderator</p>
        <h1
          className={cn(
            e.typography.displayLG,
            'mt-2 flex items-center gap-3 font-serif font-normal text-foreground',
          )}
        >
          <LayoutDashboard className="size-8 shrink-0 opacity-80" aria-hidden />
          Moderator dashboard
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Access assigned disputes, KYC reviews, and forensics tools.
        </p>
      </header>

      <section aria-labelledby="moderator-destinations-heading" className="space-y-3">
        <h2 id="moderator-destinations-heading" className={cn(e.typography.eyebrow, 'text-muted-foreground')}>
          Workspace areas
        </h2>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Shortcuts</CardTitle>
            <CardDescription>Jump to your moderation tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MODERATOR_DESTINATIONS.map(({ href, label, icon, description }) => (
                <li key={href}>
                  <ShortcutCard href={href} icon={icon} label={label} description={description} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
