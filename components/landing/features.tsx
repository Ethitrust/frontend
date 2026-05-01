import { Lock, Layers, Globe2, Workflow, Receipt, Scale } from "lucide-react"

const FEATURES = [
  {
    icon: Lock,
    title: "Regulated, segregated funds",
    body:
      "Every Birr sits in a licensed Ethiopian commercial bank trust account — never on Ethi-Trust's balance sheet.",
  },
  {
    icon: Workflow,
    title: "Milestone releases",
    body:
      "Split a deal into shipments, deliverables, or sign-offs. Funds release the moment each milestone is met.",
  },
  {
    icon: Layers,
    title: "Embeddable APIs",
    body:
      "REST + webhooks let your platform create escrows, listen for events, and trigger payouts in a few lines.",
  },
  {
    icon: Globe2,
    title: "Multi-currency settlement",
    body:
      "Hold in USD, EUR, GBP, or local currency. FX is locked at link creation so neither side gets surprised.",
  },
  {
    icon: Receipt,
    title: "Audit-ready receipts",
    body:
      "Every action — KYB, deposit, release, dispute — is signed and archived. Export to your ERP in one click.",
  },
  {
    icon: Scale,
    title: "Built-in dispute resolution",
    body:
      "If a trade goes sideways, our licensed mediators step in. Most cases resolve in under 72 hours.",
  },
]

export function Features() {
  return (
    <section id="security" className="relative scroll-mt-24 border-y border-border bg-card/40 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Why teams choose Ethi-Trust
            </p>
            <h2 className="mt-3 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Trust, made <em className="italic">operational.</em>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              We packaged the boring, regulated parts of B2B payments — trust accounts, KYB,
              dispute resolution — into a few primitives your team can ship in an afternoon.
            </p>

            <div className="mt-8 rounded-2xl border border-border bg-background p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">Bank-grade by design</p>
                  <p className="text-xs text-muted-foreground">
                    NBE Compliant · Audited · Encrypted
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <li className="rounded-md border border-border bg-card px-3 py-2">256-bit encryption</li>
                <li className="rounded-md border border-border bg-card px-3 py-2">MFA required</li>
                <li className="rounded-md border border-border bg-card px-3 py-2">Role-based access</li>
                <li className="rounded-md border border-border bg-card px-3 py-2">Immutable audit log</li>
              </ul>
            </div>
          </div>

          <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:col-span-7 md:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.title} className="bg-card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground">
                  <f.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-serif text-xl tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
