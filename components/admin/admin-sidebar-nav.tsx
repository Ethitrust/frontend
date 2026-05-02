'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ADMIN_NAV_SECTIONS, isAdminNavItemActive } from '@/lib/dashboard/admin-nav'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { typography } = ethitrustThemeTokens

  return (
    <nav className="flex flex-col gap-6" aria-label="Admin workspace">
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.heading}>
          <p className={cn(typography.eyebrow, 'mb-2 px-2 text-[0.65rem] opacity-80')}>
            {section.heading}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = item.icon
              const active = isAdminNavItemActive(pathname ?? '', item)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
