import { ethitrustThemeTokens } from "@/lib/ethitrust-theme"
import { SiteNav } from "@/components/landing/site-nav"
import { Hero } from "@/components/landing/hero"
import { TrustBadges } from "@/components/landing/trust-badges"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Stats } from "@/components/landing/stats"
import { Features } from "@/components/landing/features"
import { Integrations } from "@/components/landing/integrations"
import { Testimonial } from "@/components/landing/testimonial"
import { Partners } from "@/components/landing/partners"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { CTA } from "@/components/landing/cta"
import { SiteFooter } from "@/components/landing/site-footer"

export default function Page() {
  return (
    <main className={ethitrustThemeTokens.layout.page}>
      <SiteNav />
      <Hero />
      <TrustBadges />
      <HowItWorks />
      <Stats />
      <Features />
      <Integrations />
      <Testimonial />
      <Partners />
      <Pricing />
      <FAQ />
      <CTA />
      <SiteFooter />
    </main>
  )
}
