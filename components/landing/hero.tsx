"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const EscrowVault3D = dynamic(
  () => import("./escrow-vault-3d").then((m) => m.EscrowVault3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-40 w-40 animate-pulse rounded-full border border-border/30" />
      </div>
    ),
  },
)

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-10 pb-16 lg:px-10 lg:pt-16 lg:pb-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left column: Copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              NBE Compliant · Trusted across Ethiopia
            </div>

            <h1 className="mt-6 text-balance font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Escrow, built for
              <br />
              <span className="italic text-foreground/90">Ethiopian commerce.</span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Ethi-Trust is the trust layer for Ethiopian marketplaces. Open an account, generate a
              secure escrow link, and close high-value deals between buyers and sellers — without
              the bank queues, the disputes, or the sleepless nights.
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Create free account
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground text-primary transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-3 py-3 text-sm text-foreground/80 hover:text-foreground"
              >
                See how it works
                <span aria-hidden>→</span>
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Held in escrow</dt>
                <dd className="mt-1 font-serif text-2xl tracking-tight">ETB 2.8B</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Avg. release</dt>
                <dd className="mt-1 font-serif text-2xl tracking-tight">48h</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Dispute rate</dt>
                <dd className="mt-1 font-serif text-2xl tracking-tight">0.12%</dd>
              </div>
            </dl>
          </div>

          {/* Right column: 3D Globe */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative h-[400px] w-full max-w-[500px] sm:h-[450px] lg:h-[520px] lg:max-w-[560px]">
              {/* Subtle glow behind globe */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
              </div>
              <EscrowVault3D className="relative z-10 h-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom logo cloud */}
      <div className="relative z-10 border-y border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Integrated with
            </p>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-3 md:flex md:items-center md:gap-12">
              {["Telebirr", "CBE Birr", "Dashen Pay", "Awash Bank", "Amole"].map((b) => (
                <li
                  key={b}
                  className="font-serif text-lg tracking-tight text-foreground/70"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
