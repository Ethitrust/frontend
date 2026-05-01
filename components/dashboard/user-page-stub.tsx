import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export function UserPageStub({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  const e = ethitrustThemeTokens
  return (
    <div className={cn(e.layout.container, 'max-w-3xl py-10 lg:py-14')}>
      {eyebrow ? (
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>{eyebrow}</p>
      ) : null}
      <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
        {title}
      </h1>
      {description ? (
        <p className={cn(e.typography.bodyMuted, 'mt-4 max-w-lg')}>{description}</p>
      ) : null}
    </div>
  )
}
