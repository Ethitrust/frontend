"use client";

import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { SiteNav } from "@/components/landing/site-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { cn } from "@/lib/utils";
import { 
  Terminal, 
  Key, 
  Webhook, 
  Activity, 
  ShieldCheck, 
  ChevronRight, 
  Code2, 
  Globe, 
  Cpu
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function DeveloperGuidePage() {
  const e = ethitrustThemeTokens;

  return (
    <main className={e.layout.page}>
      <SiteNav />

      {/* Hero Section */}
      <section className={cn("relative overflow-hidden border-b border-border/40", e.layout.heroInner)}>
        <div className={cn(e.surfaces.accentGlow, "absolute -top-24 -right-24 h-96 w-96 opacity-50")} />
        <div className={e.layout.container}>
          <div className="max-w-3xl">
            <div className={e.surfaces.pillBadge}>
              <div className={e.controls.liveDotOuter}>
                <span className={e.controls.liveDotPing} />
                <span className={e.controls.liveDot} />
              </div>
              API v1.0 • Stable
            </div>
            <h1 className={cn(e.typography.displayXL, "mt-6")}>
              Developer <span className={e.typography.displayItalic}>Integration</span> Guide
            </h1>
            <p className={cn(e.typography.bodyLead, "mt-6")}>
              Build trust directly into your application. Ethitrust's Escrow-as-a-Service allows you to programmatically create, manage, and verify secure transactions with just a few lines of code.
            </p>
          </div>
        </div>
      </section>

      <section className={cn(e.layout.container, "grid gap-12 py-16 lg:grid-cols-[1fr_300px] lg:py-24")}>
        {/* Main Content */}
        <div className="space-y-20">
          
          {/* Quick Start */}
          <section id="quick-start" className={e.layout.scrollMt}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Terminal className="size-5" />
              </div>
              <h2 className={e.typography.displayLG}>Quick Start</h2>
            </div>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The Ethitrust API is organized around REST. Our API has predictable resource-oriented URLs, accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes.
            </p>
            
            <div className="mt-8 rounded-2xl border bg-card/50 p-1 font-mono text-sm overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-border" />
                  <div className="h-2.5 w-2.5 rounded-full bg-border" />
                  <div className="h-2.5 w-2.5 rounded-full bg-border" />
                </div>
                <span className="text-[10px] text-muted-foreground ml-2">GET /v1/health</span>
              </div>
              <div className="p-4">
                <pre className="text-foreground">
{`curl -X GET https://api.ethitrust.me/v1/health \\
  -H "Accept: application/json"`}
                </pre>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className={e.layout.scrollMt}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Key className="size-5" />
              </div>
              <h2 className={e.typography.displayLG}>Authentication</h2>
            </div>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Authenticate your requests by including your secret API key in the <code className="bg-muted px-1 rounded text-xs">X-API-KEY</code> header. Your API keys carry many privileges, so be sure to keep them secure!
            </p>
            <div className="mt-8 space-y-4">
              <Card className="border-border/60 bg-muted/20">
                <CardContent className="p-4 flex items-start gap-4">
                  <ShieldCheck className="size-5 text-accent mt-1 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Keep your keys safe</p>
                    <p className="text-xs text-muted-foreground mt-1">Never share your secret API keys in client-side code (browsers, mobile apps) or publicly accessible repositories like GitHub.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Core Concepts */}
          <section id="core-concepts" className={e.layout.scrollMt}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Cpu className="size-5" />
              </div>
              <h2 className={e.typography.displayLG}>Core Concepts</h2>
            </div>
            
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "The Escrow",
                  desc: "A temporary container for funds that is released only when both parties agree or a dispute is resolved.",
                  icon: ShieldCheck
                },
                {
                  title: "Idempotency",
                  desc: "Safe retries using the X-Idempotency-Key header to prevent duplicate charges or transactions.",
                  icon: Activity
                },
                {
                  title: "Webhooks",
                  desc: "Real-time notifications sent to your server whenever an escrow status changes.",
                  icon: Webhook
                },
                {
                  title: "Environments",
                  desc: "Switch between 'Test' and 'Live' modes using the appropriate API keys.",
                  icon: Globe
                }
              ].map((concept, idx) => (
                <div key={idx} className="group rounded-2xl border p-6 transition-colors hover:bg-muted/30">
                  <concept.icon className="size-6 text-primary mb-4" />
                  <h3 className="font-semibold">{concept.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{concept.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Creating an Escrow */}
          <section id="implementation" className={e.layout.scrollMt}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Code2 className="size-5" />
              </div>
              <h2 className={e.typography.displayLG}>Creating an Escrow</h2>
            </div>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              To start a new transaction, send a POST request to the <code className="bg-muted px-1 rounded text-xs">/org-escrows</code> endpoint.
            </p>

            <Tabs defaultValue="curl" className="mt-8">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="curl" className="text-xs">cURL</TabsTrigger>
                <TabsTrigger value="javascript" className="text-xs">JavaScript</TabsTrigger>
                <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
              </TabsList>
              <TabsContent value="curl" className="rounded-xl border bg-card p-4 font-mono text-xs overflow-x-auto">
{`curl -X POST https://api.ethitrust.me/v1/org-escrows \\
  -H "X-API-KEY: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Premium Web Design Service",
    "amount": 250000,
    "invitee_email": "client@example.com",
    "inspection_period": 48
  }'`}
              </TabsContent>
              <TabsContent value="javascript" className="rounded-xl border bg-card p-4 font-mono text-xs overflow-x-auto">
{`const response = await fetch('https://api.ethitrust.me/v1/org-escrows', {
  method: 'POST',
  headers: {
    'X-API-KEY': 'your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Premium Web Design Service',
    amount: 250000,
    invitee_email: 'client@example.com',
    inspection_period: 48
  })
});

const data = await response.json();`}
              </TabsContent>
              <TabsContent value="python" className="rounded-xl border bg-card p-4 font-mono text-xs overflow-x-auto">
{`import requests

payload = {
    "title": "Premium Web Design Service",
    "amount": 250000,
    "invitee_email": "client@example.com",
    "inspection_period": 48
}

headers = {
    "X-API-KEY": "your_api_key_here",
    "Content-Type": "application/json"
}

r = requests.post("https://api.ethitrust.me/v1/org-escrows", json=payload, headers=headers)`}
              </TabsContent>
            </Tabs>
          </section>

          {/* Webhooks */}
          <section id="webhooks" className={e.layout.scrollMt}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Webhook className="size-5" />
              </div>
              <h2 className={e.typography.displayLG}>Webhooks</h2>
            </div>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Ethitrust uses webhooks to notify your application when an event happens in your account. Webhooks are particularly useful for asynchronous events like a customer completing a payment or a dispute being opened.
            </p>
            
            <div className="mt-8 rounded-2xl border bg-muted/10 p-6">
              <h4 className="text-sm font-semibold mb-4">Supported Events</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  "escrow.invited",
                  "escrow.active",
                  "escrow.cancelled",
                  "escrow.submitted",
                  "escrow.completed",
                  "escrow.disputed"
                ].map(event => (
                  <div key={event} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="size-3 text-accent" />
                    <code className="bg-background px-1 rounded border">{event}</code>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Sidebar Navigation */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">On this page</h4>
              <nav className="mt-4 flex flex-col gap-3">
                {[
                  { label: "Quick Start", href: "#quick-start" },
                  { label: "Authentication", href: "#authentication" },
                  { label: "Core Concepts", href: "#core-concepts" },
                  { label: "Implementation", href: "#implementation" },
                  { label: "Webhooks", href: "#webhooks" },
                ].map(link => (
                  <a 
                    key={link.href} 
                    href={link.href} 
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-2xl border bg-primary p-6 text-primary-foreground">
              <p className="text-sm font-semibold">Need help?</p>
              <p className="mt-2 text-xs text-primary-foreground/70 leading-relaxed">
                Our developer support team is available 24/7 to help you with your integration.
              </p>
              <button className="mt-4 w-full rounded-lg bg-background py-2 text-xs font-medium text-foreground transition-transform hover:scale-[1.02]">
                Contact Support
              </button>
            </div>
          </div>
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
