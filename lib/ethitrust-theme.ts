/**
 * Ethi-Trust design language derived from the landing page + globals.css.
 * Colors resolve via Tailwind semantic tokens (bg-primary, text-muted-foreground, etc.)
 * backed by CSS variables in app/globals.css.
 */
export const ethitrustCssVars = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  border: '--border',
  radius: '--radius',
} as const

export const ethitrustThemeTokens = {
  brand: {
    name: 'Ethi-Trust',
    paletteNote:
      'Warm cream minimalist B2B fintech; primary = deep ink; accent = trust emerald.',
  },

  layout: {
    /** max-w-7xl horizontal chrome used across landing sections */
    container: 'mx-auto max-w-7xl px-6 lg:px-10',
    /** Default vertical rhythm for marketing sections */
    sectionY: 'py-24 lg:py-32',
    /** Anchor offset under sticky nav */
    scrollMt: 'scroll-mt-24',
    /** Hero inner vertical spacing (differs from standard sections) */
    heroInner: 'pt-10 pb-16 lg:pt-16 lg:pb-24',
    /** Full-viewport marketing shell */
    page: 'min-h-screen bg-background text-foreground',
  },

  typography: {
    /** Eyebrow / kicker (SECTION LABEL) */
    eyebrow: 'text-xs uppercase tracking-[0.22em] text-muted-foreground',
    /** Slightly tighter eyebrow variant seen in hero strip */
    eyebrowWide: 'text-xs uppercase tracking-[0.2em] text-muted-foreground',
    /** Display serif — hero */
    displayXL:
      'text-balance font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl',
    /** Display serif — section titles */
    displayLG:
      'text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl',
    /** Italic emphasis inside display lines */
    displayItalic: 'italic text-foreground/90',
    /** Supporting paragraph under headings */
    bodyMuted:
      'max-w-md text-sm leading-relaxed text-muted-foreground',
    /** Hero lead — wider, larger */
    bodyLead:
      'max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg',
    /** dt labels in stat grids */
    statLabel: 'text-xs uppercase tracking-wider text-muted-foreground',
    statValue: 'mt-1 font-serif text-2xl tracking-tight',
    /** Logo wordmark */
    wordmark: 'font-serif text-xl tracking-tight',
  },

  surfaces: {
    /** Sticky marketing header */
    stickyHeader:
      'sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg',
    /** Hero / pill badge */
    pillBadge:
      'inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur',
    /** Muted band (logo cloud, etc.) */
    bandMuted: 'border-y border-border bg-card/40',
    /** Features-style section with muted band */
    sectionBand: 'relative border-y border-border bg-card/40 py-24 lg:py-32',
    /** Inset card on cream */
    insetCard: 'rounded-2xl border border-border bg-background p-5',
    /** Dense feature grid wrapper */
    featureMatrix:
      'grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2',
    /** Primary inverse CTA panel */
    ctaPanel:
      'relative overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground sm:p-14 lg:p-20',
    /** Soft emerald glow (3D hero, CTA) */
    accentGlow: 'rounded-full bg-accent/5 blur-3xl',
    accentGlowStrong: 'rounded-full bg-accent/20 blur-3xl',
  },

  controls: {
    /** Primary filled button — hero */
    primaryButtonLg:
      'group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]',
    /** Primary filled button — nav */
    primaryButtonMd:
      'group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]',
    /** Ghost text button */
    ghostLink:
      'inline-flex items-center gap-2 px-3 py-3 text-sm text-foreground/80 hover:text-foreground',
    /** Nav text links */
    navLink: 'text-sm text-muted-foreground transition-colors hover:text-foreground',
    /** Icon chip on accent */
    brandMark: 'flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground',
    /** Ping dot wrapper for live status */
    liveDotOuter: 'relative flex h-1.5 w-1.5',
    liveDotPing:
      'absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75',
    liveDot: 'relative inline-flex h-1.5 w-1.5 rounded-full bg-accent',
  },

  composition: {
    statRow:
      'mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6',
  },
} as const

export type EthitrustThemeTokens = typeof ethitrustThemeTokens
