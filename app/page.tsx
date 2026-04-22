import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Lock,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  User,
} from "lucide-react";
import { landingAssets } from "@/lib/landing-assets";

const features: {
  title: string;
  body: ReactNode;
  iconBg: string;
  Icon: LucideIcon;
  iconClass: string;
}[] = [
  {
    title: "AI Fraud Detection",
    body: (
      <>
        Our proprietary algorithms monitor every transaction in real-time,
        detecting suspicious patterns before they become threats.
      </>
    ),
    iconBg: "bg-[#d0e4ff]",
    Icon: ShieldAlert,
    iconClass: "text-[#002f6c]",
  },
  {
    title: "Secure Escrow Payments",
    body: (
      <>
        Funds are held in a secure digital vault and only released once both
        parties are satisfied with the delivery and service.
      </>
    ),
    iconBg: "bg-[#69ff87]",
    Icon: Lock,
    iconClass: "text-[#002108]",
  },
  {
    title: "Dispute Protection",
    body: (
      <>
        A dedicated team of experts and automated resolution protocols ensure
        fair outcomes for both buyers and sellers.
      </>
    ),
    iconBg: "bg-[#d8e2ff]",
    Icon: Scale,
    iconClass: "text-[#002f6c]",
  },
];

const testimonials = [
  {
    quote: (
      <>
        &ldquo;EthiTrust changed the game for my freelance design business. I no
        longer worry about getting paid after finishing a project. It&apos;s the
        professional standard we needed.&rdquo;
      </>
    ),
    initials: "AK",
    name: "Aman Kassahun",
    role: "UI/UX Designer",
    avatarBg: "bg-[#d8e2ff]",
    avatarText: "text-[#001b44]",
  },
  {
    quote: (
      <>
        &ldquo;Selling electronics online used to be risky. Now, I just tell my
        customers to use EthiTrust. It gives them peace of mind and protects me
        from fraudulent claims.&rdquo;
      </>
    ),
    initials: "MM",
    name: "Mekdes Mesfin",
    role: "E-commerce Seller",
    avatarBg: "bg-[#69ff87]",
    avatarText: "text-[#002108]",
  },
  {
    quote: (
      <>
        &ldquo;The UI is clean and the AI fraud detection is impressively fast.
        As a developer, I appreciate the transparency and security of their
        escrow logic.&rdquo;
      </>
    ),
    initials: "BT",
    name: "Biruk Tadesse",
    role: "Software Engineer",
    avatarBg: "bg-[#d0e4ff]",
    avatarText: "text-[#001d35]",
  },
] as const;

function StarRow() {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="size-5 fill-[#69ff87] text-[#69ff87]" strokeWidth={1.5} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#faf8ff] text-[#001b44]">
      <header className="sticky top-0 z-50 border-b border-[rgba(196,198,210,0.12)] bg-[rgba(250,248,255,0.72)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-8 py-4">
          <Link
            href="/"
            className="font-heading text-2xl font-semibold tracking-tight text-[#001b44]"
          >
            EthiTrust
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a
              href="#features"
              className="border-b-2 border-[#001b44] pb-1.5 text-[#001b44]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-[#434750] transition-colors hover:text-[#001b44]"
            >
              How it works
            </a>
            <a
              href="#testimonials"
              className="text-[#434750] transition-colors hover:text-[#001b44]"
            >
              Testimonials
            </a>
            <a
              href="#support"
              className="text-[#434750] transition-colors hover:text-[#001b44]"
            >
              Support
            </a>
          </nav>
          <Link
            href="/auth"
            className="shrink-0 rounded-lg bg-[#002f6c] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Create Escrow
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-8 pb-16 pt-12 sm:pb-24 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(216,226,255,1) 0%, rgba(250,248,255,1) 70%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#5cfd80] px-4 py-2">
              <ShieldCheck className="size-3.5 shrink-0 text-[#00732c]" strokeWidth={2.25} aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[#00732c]">
                AI-Secured Ethiopian Escrow
              </span>
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-[-0.05em] sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
              Secure Payments.
              <br />
              Zero Trust Required.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[#434750] sm:text-xl sm:leading-[32.5px]">
              Reliable escrow solutions for Ethiopian freelancers, online
              sellers, and buyers. Secure your transactions with AI-powered
              fraud detection.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth"
                className="rounded-xl bg-[#001b44] px-8 py-4 text-lg font-semibold text-white"
              >
                Create Escrow
              </Link>
              <a
                href="#how-it-works"
                className="rounded-xl bg-[#f2f3ff] px-8 py-4 text-lg font-semibold text-[#001b44]"
              >
                How It Works
              </a>
            </div>
          </div>

          <div className="relative rounded-3xl border border-[rgba(196,198,210,0.15)] bg-[rgba(255,255,255,0.6)] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative flex size-20 items-center justify-center rounded-full bg-[#002f6c] shadow-lg">
                    <User className="size-5 text-white" strokeWidth={2} aria-hidden />
                  </div>
                  <span className="text-base font-semibold">Buyer</span>
                </div>

                <div className="relative hidden min-h-[2px] flex-1 sm:block">
                  <div className="h-0.5 w-full bg-linear-to-r from-[#002f6c] via-[#006e2a] to-[#002f6c]" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(196,198,210,0.2)] bg-white px-3 py-1 text-center text-[10px] font-semibold leading-tight text-[#131b2e]">
                    ETB
                    <br />
                    DEPOSIT
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div
                    className="relative flex size-24 flex-col items-center justify-center gap-1 rounded-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(0, 27, 68) 0%, rgb(0, 47, 108) 100%)",
                    }}
                  >
                    <Shield className="mt-1 size-7 text-white" strokeWidth={2} aria-hidden />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                      EthiTrust
                    </span>
                  </div>
                </div>

                <div className="relative hidden min-h-[2px] flex-1 sm:block">
                  <div className="h-0.5 w-full bg-linear-to-r from-[#002f6c] via-[#006e2a] to-[#002f6c]" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(196,198,210,0.2)] bg-white px-3 py-1 text-[10px] font-semibold text-[#131b2e]">
                    PAYOUT
                  </span>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="relative flex size-20 items-center justify-center rounded-full bg-[#5cfd80] shadow-lg">
                    <Store className="size-6 text-[#001b44]" strokeWidth={2} aria-hidden />
                  </div>
                  <span className="text-base font-semibold">Seller</span>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-[rgba(226,231,255,0.4)] p-4">
                <Sparkles className="size-9 shrink-0 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-[#001b44]">
                    AI Verification Active
                  </p>
                  <p className="mt-0.5 text-xs text-[#434750]">
                    Monitoring transaction patterns for 100% safety.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#f2f3ff] px-8 py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Built for Unbreakable Trust
            </h2>
            <p className="mt-4 text-lg text-[#434750]">
              Sophisticated protection layers designed for the Ethiopian digital
              economy.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => {
              const { Icon } = f;
              return (
              <article
                key={f.title}
                className="flex flex-col gap-4 rounded-3xl border border-[rgba(196,198,210,0.1)] bg-white p-10 shadow-sm"
              >
                <div
                  className={`flex size-14 items-center justify-center rounded-xl ${f.iconBg}`}
                >
                  <Icon className={`size-7 ${f.iconClass}`} strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="font-heading text-2xl font-bold">{f.title}</h3>
                <p className="text-base leading-[26px] text-[#434750]">
                  {f.body}
                </p>
              </article>
            );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-8 py-24">
        <div className="mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <ul className="mt-12 space-y-12">
              <li className="flex gap-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#001b44] text-xl font-semibold text-white">
                  1
                </span>
                <div>
                  <h4 className="text-xl font-semibold">
                    Create a deal and invite your partner.
                  </h4>
                  <p className="mt-2 text-[#434750]">
                    Simply outline the terms of your agreement and send an
                    invite link to the other party via Telegram, WhatsApp, or
                    Email.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#001b44] text-xl font-semibold text-white">
                  2
                </span>
                <div>
                  <h4 className="text-xl font-semibold">
                    Buyer deposits funds into secure escrow.
                  </h4>
                  <p className="mt-2 text-[#434750]">
                    The buyer pays using Chapa. EthiTrust verifies the deposit
                    and notifies the seller to proceed.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#001b44] text-xl font-semibold text-white">
                  3
                </span>
                <div>
                  <h4 className="text-xl font-semibold">
                    Seller delivers, and funds are released upon approval.
                  </h4>
                  <p className="mt-2 text-[#434750]">
                    Once the service or product is delivered, the buyer confirms
                    satisfaction, and the funds are instantly released to the
                    seller.
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="relative aspect-4/5 max-h-[500px] w-full sm:aspect-auto sm:h-[500px]">
              <Image
                src={landingAssets.escrowDashboard}
                alt="Escrow agreement and dashboard"
                fill
                className="object-cover object-[center_28%]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.6)] p-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#69ff87]/25 text-[#006e2a]">
                  <BadgeCheck className="size-7" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-[#001b44]">
                    Transaction Protected
                  </p>
                  <p className="text-xs text-[#001b44]/80">
                    AI verified: Secure deposit confirmed (124,500 ETB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="bg-[rgba(218,226,253,0.3)] px-8 py-24"
      >
        <div className="mx-auto max-w-[1280px]">
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Trusted by Professionals
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <article
                key={t.name}
                className="flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                <StarRow />
                <p className="flex-1 text-base italic leading-[26px] text-[#434750]">
                  {t.quote}
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div
                    className={`flex size-12 items-center justify-center rounded-full text-base font-semibold ${t.avatarBg} ${t.avatarText}`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[#001b44]">{t.name}</p>
                    <p className="text-sm text-[#434750]">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-8 pb-24 pt-8">
        <div className="relative mx-auto max-w-[960px] overflow-hidden rounded-3xl bg-[#001b44] px-8 py-16 text-center sm:px-16">
          <div
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#002f6c] opacity-50"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-[#69ff87] opacity-20"
            aria-hidden
          />
          <h2 className="relative font-heading text-3xl font-extrabold text-white sm:text-4xl">
            Ready to secure your next transaction?
          </h2>
          <p className="relative mx-auto mt-6 max-w-xl text-lg text-white/90">
            Join thousands of Ethiopian businesses and freelancers using
            EthiTrust to build a safer digital future.
          </p>
          <Link
            href="/auth"
            className="relative mt-8 inline-flex rounded-xl bg-[#69ff87] px-12 py-5 text-lg font-semibold text-[#002108] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
          >
            Create Your First Escrow
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="support" className="bg-[#f2f3ff] px-8 py-12">
        <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-4">
          <div>
            <p className="text-xl font-semibold text-[#001b44]">EthiTrust</p>
            <p className="mt-3 text-sm leading-relaxed text-[#434750]">
              Protecting the digital heartbeat of Ethiopia with smart, AI-driven
              financial security.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#001b44]">Quick Links</p>
            <ul className="mt-4 space-y-2 text-sm text-[#434750]/80">
              <li>
                <a href="#features" className="hover:text-[#001b44]">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#001b44]">
                  How it works
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-[#001b44]">
                  Testimonials
                </a>
              </li>
              <li>
                <span className="cursor-default">FAQ</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-[#001b44]">Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-[#434750]/80">
              <li>
                <span className="cursor-default">Privacy Policy</span>
              </li>
              <li>
                <span className="cursor-default">Terms of Service</span>
              </li>
              <li>
                <span className="cursor-default">Contact Us</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-[#001b44]">Newsletter</p>
            <div className="mt-4 flex gap-2">
              <label className="sr-only" htmlFor="newsletter-email">
                Email
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email"
                className="min-w-0 flex-1 rounded-lg bg-[#dae2fd] px-3 py-2.5 text-sm text-[#001b44] outline-none ring-[#002f6c] placeholder:text-[#6b7280] focus:ring-2"
              />
              <button
                type="button"
                className="shrink-0 rounded-lg bg-[#001b44] px-4 py-2 text-sm font-semibold text-white"
              >
                Join
              </button>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-[1280px] border-t border-[rgba(196,198,210,0.1)] pt-8 text-center text-sm text-[#434750]">
          <p>© 2026 EthiTrust. The Digital Guardian of Ethiopian Commerce.</p>
          <p className="mt-2">
            <Link
              href="/map"
              className="text-[#002f6c] underline-offset-2 hover:underline"
            >
              Screen map (dev)
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
