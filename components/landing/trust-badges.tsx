"use client"

import { Shield, Lock, BadgeCheck, Building2, Scale, FileCheck } from "lucide-react"

const BADGES = [
  {
    icon: Building2,
    title: "NBE Licensed",
    description: "Regulated under National Bank of Ethiopia guidelines",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "256-bit encryption for all transactions",
  },
  {
    icon: Lock,
    title: "Funds Protected",
    description: "Held in licensed Ethiopian commercial banks",
  },
  {
    icon: BadgeCheck,
    title: "KYB Verified",
    description: "All businesses undergo verification",
  },
  {
    icon: Scale,
    title: "Fair Disputes",
    description: "Neutral arbitration for all parties",
  },
  {
    icon: FileCheck,
    title: "Audit Trail",
    description: "Complete transaction history",
  },
]

export function TrustBadges() {
  return (
    <section className="border-y border-border bg-card/30 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {BADGES.map((badge) => (
            <div key={badge.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <badge.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-medium">{badge.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
