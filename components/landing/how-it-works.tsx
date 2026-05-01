import { UserPlus, Link2, Handshake } from "lucide-react"

const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Open a verified account",
    body:
      "Sign up your business in minutes. KYB and trade license checks run in the background while you set up your team, roles, and payout rails.",
    bullets: ["Fast KYB verification", "Multi-seat workspaces", "API keys + webhooks"],
    visual: <SignupVisual />,
  },
  {
    n: "02",
    icon: Link2,
    title: "Generate a secure escrow link",
    body:
      "Drop a link into a checkout, an email, or a Telegram message. Each link is a tamper-proof contract: amount, terms, milestones, and release conditions.",
    bullets: ["1-click link or REST API", "Milestones & partial releases", "Auto-expiry & reminders"],
    visual: <LinkVisual />,
  },
  {
    n: "03",
    icon: Handshake,
    title: "Close the trade — trustfully",
    body:
      "Funds sit in a regulated escrow account until both sides confirm. If something goes sideways, our resolution flow steps in. No funds lost. No relationships burned.",
    bullets: ["Buyer & seller acceptance", "Dispute resolution included", "Audit-ready receipts"],
    visual: <TradeVisual />,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Three steps from <em className="font-serif italic">handshake</em> to settlement.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Built so a procurement team can use it on a Tuesday and an engineering team can
            embed it on a Wednesday. Simple and straightforward.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{step.n}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground">
                  <step.icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>

              <div className="mt-6 aspect-[4/3] overflow-hidden rounded-xl border border-border bg-background">
                {step.visual}
              </div>

              <h3 className="mt-6 font-serif text-2xl leading-tight tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

              <ul className="mt-5 space-y-2 text-sm">
                {step.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-foreground/80">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-accent" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* --- Visuals (diagrammatic UI ghosts) ---------------- */

function SignupVisual() {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-secondary" />
        <div className="space-y-1.5">
          <div className="h-2 w-24 rounded-full bg-secondary" />
          <div className="h-1.5 w-16 rounded-full bg-secondary/70" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Business name
        </div>
        <div className="h-9 rounded-md border border-border bg-card" />
      </div>
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          TIN
        </div>
        <div className="flex h-9 items-center justify-between rounded-md border border-border bg-card px-3">
          <span className="font-mono text-xs text-foreground/70">00-•••••42</span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
            Verified
          </span>
        </div>
      </div>
      <div className="mt-auto flex h-9 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">
        Continue
      </div>
    </div>
  )
}

function LinkVisual() {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Escrow link
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          Draft
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-[10px] font-mono">
          ↗
        </span>
        <span className="truncate font-mono text-[11px] text-foreground/80">
          ethitrust.et/e/8f3-addis
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border bg-card p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</div>
          <div className="mt-1 font-serif text-lg tracking-tight">ETB 482K</div>
        </div>
        <div className="rounded-md border border-border bg-card p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Release</div>
          <div className="mt-1 text-xs text-foreground/80">On delivery</div>
        </div>
      </div>
      <div className="mt-auto flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-xs text-primary-foreground">
        <span>Send to buyer</span>
      </div>
    </div>
  )
}

function TradeVisual() {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="rounded-md border border-border bg-card p-2 text-center">
          <div className="mx-auto mb-1 h-6 w-6 rounded-full bg-secondary" />
          <div className="text-[10px] text-muted-foreground">Buyer</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-px w-full bg-border" />
          <div className="my-1 rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[10px]">
            ESCROW
          </div>
          <div className="h-px w-full bg-border" />
        </div>
        <div className="rounded-md border border-border bg-card p-2 text-center">
          <div className="mx-auto mb-1 h-6 w-6 rounded-full bg-secondary" />
          <div className="text-[10px] text-muted-foreground">Seller</div>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: "Funds deposited", done: true },
          { label: "Goods shipped", done: true },
          { label: "Buyer accepted", done: false },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
          >
            <span className="text-xs text-foreground/80">{row.label}</span>
            <span
              className={
                row.done
                  ? "rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent"
                  : "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              }
            >
              {row.done ? "Done" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
