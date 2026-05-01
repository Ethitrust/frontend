"use client"

import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const TESTIMONIALS = [
  {
    quote:
      "We were running millions of Birr monthly through bank transfers and WhatsApp confirmations. Ethi-Trust turned that into a link our buyers actually trust — and our finance team finally sleeps.",
    name: "Abebe Bekele",
    role: "Head of Finance",
    company: "Northwind Industrial",
    city: "Addis Ababa",
  },
  {
    quote:
      "Before Ethi-Trust, we lost deals because buyers were nervous about paying upfront. Now our escrow link closes deals faster than our old process ever did.",
    name: "Tigist Hailu",
    role: "CEO",
    company: "Habesha Textiles",
    city: "Dire Dawa",
  },
  {
    quote:
      "The milestone releases changed everything. Our suppliers ship faster knowing funds are secured, and our warehouse only pays when goods arrive.",
    name: "Samuel Girma",
    role: "Operations Director",
    company: "Blue Nile Logistics",
    city: "Bahir Dar",
  },
  {
    quote:
      "As a seller, I was always worried about chargebacks and payment disputes. Ethi-Trust protects both sides — my revenue is secure and buyers trust me more.",
    name: "Meron Tadesse",
    role: "Founder",
    company: "Meron Coffee Export",
    city: "Hawassa",
  },
  {
    quote:
      "We integrated Ethi-Trust into our marketplace in one afternoon. Transaction disputes dropped by 90% in the first month alone.",
    name: "Dawit Alemayehu",
    role: "CTO",
    company: "Selam Marketplace",
    city: "Jimma",
  },
  {
    quote:
      "Cross-border B2B trade was always risky. Ethi-Trust gives our international partners confidence to do business with Ethiopian suppliers.",
    name: "Hana Mekonnen",
    role: "Export Manager",
    company: "Axum Trading Co.",
    city: "Mekelle",
  },
]

export function Testimonial() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  )
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = React.useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  )

  React.useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  return (
    <section className="relative border-y border-border bg-card/40 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <p className="text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Trusted by Ethiopian businesses
        </p>

        <div className="relative mt-10">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {TESTIMONIALS.map((testimonial, index) => (
                <div
                  key={index}
                  className="min-w-0 flex-[0_0_100%] px-4 md:flex-[0_0_80%] lg:flex-[0_0_60%]"
                >
                  <blockquote className="text-center">
                    <p className="text-balance font-serif text-2xl leading-relaxed tracking-tight sm:text-3xl lg:text-4xl">
                      <span className="text-muted-foreground">&ldquo;</span>
                      {testimonial.quote}
                      <span className="text-muted-foreground">&rdquo;</span>
                    </p>
                    <footer className="mt-8 flex items-center justify-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
                        {testimonial.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {testimonial.role} · {testimonial.company}
                        </div>
                        <div className="text-xs text-muted-foreground/70">
                          {testimonial.city}
                        </div>
                      </div>
                    </footer>
                  </blockquote>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                index === selectedIndex
                  ? "bg-accent"
                  : "bg-border hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
