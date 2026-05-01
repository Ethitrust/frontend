import { TrendingUp, Users, Shield, Clock } from "lucide-react"

const STATS = [
  {
    icon: TrendingUp,
    value: "ETB 2.8B+",
    label: "Transaction Volume",
    description: "Processed securely through our platform",
  },
  {
    icon: Users,
    value: "12,000+",
    label: "Verified Businesses",
    description: "Across all regions of Ethiopia",
  },
  {
    icon: Shield,
    value: "99.9%",
    label: "Secure Transactions",
    description: "Zero security breaches since launch",
  },
  {
    icon: Clock,
    value: "< 48hrs",
    label: "Average Settlement",
    description: "From confirmation to fund release",
  },
]

export function Stats() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Platform metrics
          </p>
          <h2 className="mt-3 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            Numbers that speak
            <br />
            <em className="italic">trust.</em>
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <stat.icon className="h-6 w-6" aria-hidden />
              </div>
              <div className="mt-6 font-serif text-4xl tracking-tight">{stat.value}</div>
              <div className="mt-2 text-sm font-medium">{stat.label}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              <div
                className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-accent/5 transition-transform group-hover:scale-150"
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
