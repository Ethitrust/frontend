import Link from "next/link"

const COLS = [
  {
    title: "Product",
    links: ["Escrow links", "API & SDKs", "Plug-ins", "Pricing", "Changelog"],
  },
  {
    title: "Solutions",
    links: ["Marketplaces", "Wholesale", "Equipment", "Services", "Cross-border"],
  },
  {
    title: "Company",
    links: ["About", "Customers", "Security", "Press", "Careers"],
  },
  {
    title: "Resources",
    links: ["Docs", "Status", "Support", "Compliance", "Contact"],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v18" />
                  <path d="M5 7h14" />
                  <path d="M5 7l-2 8h6L5 7z" />
                  <path d="M19 7l2 8h-6l4-8z" />
                  <circle cx="12" cy="3" r="1" />
                </svg>
              </span>
              <span className="font-serif text-xl tracking-tight">Ethi-Trust</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The trust layer for Ethiopian B2B commerce. Held in escrow at licensed commercial banks,
              regulated under National Bank of Ethiopia guidelines.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              Ethi-Trust is a financial technology company operating under Ethiopian law. 
              Partner bank services provided by licensed commercial banks.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
            {COLS.map((col) => (
              <div key={col.title}>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <Link
                        href="#"
                        className="text-sm text-foreground/80 hover:text-foreground"
                      >
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Ethi-Trust. All rights reserved.</p>
          <ul className="flex flex-wrap gap-5">
            <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
            <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
            <li><Link href="#" className="hover:text-foreground">Licenses</Link></li>
            <li><Link href="#" className="hover:text-foreground">Disclosures</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
