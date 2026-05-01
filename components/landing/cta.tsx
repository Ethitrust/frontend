"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useState } from "react"

export function CTA() {
  const [email, setEmail] = useState("")

  return (
    <section id="signup" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground sm:p-14 lg:p-20">
          {/* subtle decorative corner mark */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          />

          <div className="relative grid items-end gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/60">
                Get started
              </p>
              <h2 className="mt-3 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Your next deal,
                <br />
                <em className="italic">held in trust.</em>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/70">
                Open an Ethi-Trust account in under five minutes. No setup fee, no monthly
                minimum — you only pay on settled escrows.
              </p>
            </div>

            <div className="md:justify-self-end">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-primary-foreground/5 p-3 backdrop-blur sm:flex-row sm:items-center sm:rounded-full sm:p-1.5"
              >
                <label htmlFor="cta-email" className="sr-only">
                  Work email
                </label>
                <input
                  id="cta-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.et"
                  className="flex-1 rounded-full bg-transparent px-5 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary-foreground px-5 py-3 text-sm font-medium text-primary transition-transform hover:scale-[1.02]"
                >
                  Create account
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                </button>
              </form>
              <p className="mt-3 text-center text-xs text-primary-foreground/50 sm:text-right">
                Or{" "}
                <Link href="#contact" className="underline underline-offset-4 hover:text-primary-foreground">
                  talk to sales
                </Link>{" "}
                · No card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
