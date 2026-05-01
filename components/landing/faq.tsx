"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const FAQS = [
  {
    question: "What is escrow and how does it protect my business?",
    answer:
      "Escrow is a financial arrangement where a third party (Ethi-Trust) holds funds on behalf of two parties in a transaction. The money is only released when both parties confirm that the agreed-upon conditions have been met. This protects buyers from paying for goods they never receive, and sellers from delivering without getting paid.",
  },
  {
    question: "How long does it take to set up an account?",
    answer:
      "Most businesses can complete the verification process in under 24 hours. You&apos;ll need to provide basic business documentation including your trade license, TIN certificate, and identification for authorized signers. Once verified, you can create escrow links immediately.",
  },
  {
    question: "What currencies does Ethi-Trust support?",
    answer:
      "Currently, Ethi-Trust primarily supports Ethiopian Birr (ETB) for domestic transactions. We also support USD, EUR, and GBP for international trade. Currency conversion rates are locked at the time the escrow link is created, protecting both parties from exchange rate fluctuations.",
  },
  {
    question: "What happens if there&apos;s a dispute?",
    answer:
      "If either party raises a concern, our dispute resolution team steps in. Both parties submit evidence, and our licensed mediators review the case. Most disputes are resolved within 72 hours. If mediation fails, the case can be escalated to binding arbitration. Throughout the process, funds remain safely held in escrow.",
  },
  {
    question: "Are funds held in Ethi-Trust insured?",
    answer:
      "Yes. All funds held in escrow are maintained in segregated trust accounts at licensed Ethiopian commercial banks. These accounts are separate from Ethi-Trust&apos;s operational funds and are protected under Ethiopian banking regulations.",
  },
  {
    question: "Can I integrate Ethi-Trust with my existing systems?",
    answer:
      "Absolutely. We provide REST APIs, webhooks, and SDKs for TypeScript, Python, and Java. You can automate escrow creation, monitor transaction status, and trigger payouts directly from your ERP, e-commerce platform, or custom software.",
  },
  {
    question: "What&apos;s the minimum transaction amount?",
    answer:
      "There&apos;s no minimum for the Starter plan. For Business and Enterprise plans, we recommend transactions above ETB 10,000 to maximize the value of escrow protection relative to fees.",
  },
  {
    question: "How do I know the other party is legitimate?",
    answer:
      "Every business on Ethi-Trust undergoes KYB (Know Your Business) verification. You can see their verification status, business registration details, and transaction history before entering into an escrow agreement. This transparency builds trust before any money changes hands.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="relative border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Common questions
            </p>
            <h2 className="mt-3 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Everything you
              <br />
              <em className="italic">need to know.</em>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Can&apos;t find what you&apos;re looking for? Reach out to our support team 
              and we&apos;ll get back to you within 24 hours.
            </p>
            <a
              href="#contact"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              Contact support
              <span aria-hidden>→</span>
            </a>
          </div>

          <div className="lg:col-span-8">
            <div className="divide-y divide-border rounded-2xl border border-border">
              {FAQS.map((faq, i) => (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-secondary/50"
                    aria-expanded={openIndex === i}
                  >
                    <span className="text-sm font-medium">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        openIndex === i && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-200",
                      openIndex === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
