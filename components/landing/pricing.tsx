import Link from "next/link"
import { Check, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

const PLANS = [
  {
    name: "Starter",
    description: "For small businesses starting with escrow",
    price: "Free",
    priceDetail: "No monthly fee",
    fee: "1.5% per transaction",
    features: [
      "Up to ETB 500K monthly volume",
      "Basic KYB verification",
      "Email support",
      "Standard escrow links",
      "48-hour settlement",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Business",
    description: "For growing businesses with higher volume",
    price: "ETB 2,500",
    priceDetail: "per month",
    fee: "0.8% per transaction",
    features: [
      "Up to ETB 5M monthly volume",
      "Priority KYB verification",
      "Phone & email support",
      "Custom escrow terms",
      "24-hour settlement",
      "Multi-user accounts",
      "API access",
    ],
    cta: "Get started",
    featured: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: "Custom",
    priceDetail: "contact sales",
    fee: "Volume-based pricing",
    features: [
      "Unlimited transaction volume",
      "Dedicated account manager",
      "24/7 priority support",
      "White-label solution",
      "Same-day settlement",
      "Custom integrations",
      "SLA guarantees",
      "On-premise deployment",
    ],
    cta: "Contact sales",
    featured: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Simple pricing
          </p>
          <h2 className="mt-3 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            Pay only when you
            <br />
            <em className="italic">close deals.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            No hidden fees, no setup costs. You only pay a small percentage when 
            funds are successfully released from escrow.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
                plan.featured
                  ? "border-accent bg-accent/5"
                  : "border-border bg-card"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-medium text-accent-foreground">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="font-serif text-2xl tracking-tight">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-4xl tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.priceDetail}</span>
                </div>
                <div className="mt-2 rounded-lg bg-secondary px-3 py-2 text-sm text-foreground/80">
                  {plan.fee}
                </div>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={cn(
                  "mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-transform hover:scale-[1.02]",
                  plan.featured
                    ? "bg-accent text-accent-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {plan.cta}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
