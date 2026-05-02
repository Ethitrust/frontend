const PARTNERS = [
  {
    category: "Banking Partners",
    logos: ["Commercial Bank of Ethiopia", "Dashen Bank", "Awash Bank", "Bank of Abyssinia"],
  },
  {
    category: "Payment Partners",
    logos: ["Chapa"],
  },
  {
    category: "Industry Partners",
    logos: ["Ethiopian Chamber of Commerce", "Addis Ababa Trade Bureau", "Ethiopian Investment Commission"],
  },
]

export function Partners() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Our partners
          </p>
          <h2 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            Trusted by leading
            <br />
            <em className="italic">institutions.</em>
          </h2>
        </div>

        <div className="mt-14 space-y-12">
          {PARTNERS.map((group) => (
            <div key={group.category}>
              <h3 className="text-center text-xs uppercase tracking-widest text-muted-foreground">
                {group.category}
              </h3>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {group.logos.map((logo) => (
                  <div
                    key={logo}
                    className="flex h-14 items-center justify-center rounded-lg border border-border bg-card/50 px-6 py-3"
                  >
                    <span className="font-serif text-sm tracking-tight text-foreground/70 sm:text-base">
                      {logo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
