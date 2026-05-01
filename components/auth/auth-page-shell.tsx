import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  const { layout, typography, brand, surfaces, controls } = ethitrustThemeTokens

  return (
    <div className={cn(layout.page, 'grain')}>
      <header className={surfaces.stickyHeader}>
        <div
          className={cn(
            layout.container,
            'flex items-center justify-between py-4',
          )}
        >
          <Link href="/" className="flex items-center gap-2">
            <span className={controls.brandMark}>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v18" />
                <path d="M5 7h14" />
                <path d="M5 7l-2 8h6L5 7z" />
                <path d="M19 7l2 8h-6l4-8z" />
                <circle cx="12" cy="3" r="1" />
              </svg>
            </span>
            <span className={typography.wordmark}>{brand.name}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 lg:py-24">
        {children}
      </div>
    </div>
  )
}
