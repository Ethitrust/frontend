import { Code2 } from "lucide-react"

export function Integrations() {
  return (
    <section id="integrations" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              For e-commerce platforms
            </p>
            <h2 className="mt-3 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Drop-in escrow for the
              <br />
              cart you already have.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Ethi-Trust integrates with Ethiopian e-commerce platforms and ERPs.
              Add a &quot;Pay with Escrow&quot; option to high-ticket B2B transactions in a single day —
              no replatforming required.
            </p>
            <div className="mt-6">
              <a 
                href="/developer/guide" 
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Read the integration guide
                <span aria-hidden>→</span>
              </a>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { k: "Integrations", v: "Chapa" },
                { k: "SDKs", v: "TypeScript, Python, Java" },
                { k: "Events", v: "Webhooks + REST API" },
                { k: "Identity", v: "KYB, Trade License, TIN" },
              ].map((row) => (
                <li
                  key={row.k}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {row.k}
                  </div>
                  <div className="mt-1 text-sm text-foreground/90">{row.v}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-primary p-1 shadow-xl">
              <div className="flex items-center justify-between rounded-t-xl bg-primary px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground/20" />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-primary-foreground/60">
                  <Code2 className="h-3 w-3" aria-hidden />
                  POST /v1/escrows
                </div>
                <div className="w-12" />
              </div>
              <pre className="overflow-x-auto rounded-b-xl bg-primary p-5 font-mono text-[12px] leading-relaxed text-primary-foreground/90">
{`import { EthiTrust } from "@ethitrust/sdk";

const ethitrust = new EthiTrust(process.env.ETHITRUST_KEY);

// 1. Create an escrow link from the buyer's cart
const escrow = await ethitrust.escrows.create({
  buyer:  { email: "ops@addisimports.et" },
  seller: { email: "sales@bahirdarsteel.et" },
  amount: { value: 482_000_00, currency: "ETB" },
  terms:  "Release on signed delivery receipt",
  milestones: [
    { label: "Goods shipped",   release: 0.5 },
    { label: "Buyer accepted",  release: 0.5 },
  ],
});

// 2. Send the secure link
await sendEmail(buyer, escrow.url);
//   → https://ethitrust.et/e/8f3-addis-steel

// 3. Listen for settlement
ethitrust.on("escrow.released", (e) => {
  ledger.markPaid(e.id, e.amount);
});`}
              </pre>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-3 py-1">
                99.99% uptime SLA
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1">
                Sandbox + production
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1">
                Idempotent by default
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
