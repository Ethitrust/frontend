import { Check, ClipboardList } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

const steps = [
  { n: 1, title: "Deal summary", body: "Amount in ETB, description, and delivery window." },
  { n: 2, title: "Counterparty", body: "Invite the other party by phone, email, or secure link." },
  { n: 3, title: "Funding", body: "Deposit via Chapa, Telebirr, or your EthiTrust wallet." },
  { n: 4, title: "Confirmation", body: "Both parties accept terms; AI runs a quick risk scan." },
];

const activeStep = 1;

export default function CreateEscrowPage() {
  return (
    <UserShell>
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-12 items-center justify-center rounded-2xl bg-[#d8e2ff] text-[#002f6c]">
            <ClipboardList className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Escrow · Figma 2:3980</p>
            <h1 className="font-heading text-4xl font-normal tracking-[-0.9px] text-[#001b44]">Create escrow</h1>
            <p className="mt-1 text-base text-[#434750]">Guided flow — complete each step to open a protected deal.</p>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="mb-10 overflow-x-auto rounded-3xl border border-[#e8eaf2] bg-white px-4 py-6 sm:px-8">
        <div className="flex min-w-[640px] items-center justify-between gap-2">
          {steps.map((s, i) => {
            const done = s.n < activeStep;
            const active = s.n === activeStep;
            return (
              <div key={s.n} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center text-center">
                  <span
                    className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold ${
                      done
                        ? "bg-[#69ff87] text-[#002108]"
                        : active
                          ? "bg-[#001b44] text-white"
                          : "border-2 border-[#e2e8f0] bg-white text-[#64748b]"
                    }`}
                  >
                    {done ? <Check className="size-5" strokeWidth={2.5} aria-hidden /> : s.n}
                  </span>
                  <p className={`mt-2 max-w-[100px] text-[11px] font-medium leading-tight sm:max-w-[120px] sm:text-xs ${active ? "text-[#001b44]" : "text-[#64748b]"}`}>
                    {s.title}
                  </p>
                </div>
                {i < steps.length - 1 ? (
                  <div className={`mx-1 h-0.5 min-w-[24px] flex-1 rounded-full ${s.n < activeStep ? "bg-[#69ff87]" : "bg-[#e2e8f0]"}`} aria-hidden />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-lg font-normal text-[#001b44]">Step 1 — Deal summary</h2>
            <p className="mt-1 text-sm text-[#434750]">Describe what is being exchanged so both parties see the same terms.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Title</span>
                <input
                  className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
                  placeholder="e.g. Green coffee export — 2 tons"
                  type="text"
                />
              </label>
              <label className="block">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Amount (ETB)</span>
                <input
                  className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
                  placeholder="42,500.00"
                  type="text"
                  inputMode="decimal"
                />
              </label>
              <label className="block">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Expected delivery</span>
                <input
                  className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
                  placeholder="Nov 15, 2023"
                  type="text"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Notes for counterparty</span>
                <textarea
                  className="mt-2 min-h-[100px] w-full resize-y rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
                  placeholder="Inspection terms, shipping responsibility, milestones…"
                />
              </label>
            </div>
          </section>

          <ol className="space-y-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className={`flex gap-4 rounded-2xl border p-4 ${
                  s.n === activeStep ? "border-[#002f6c] bg-[#f2f3ff]/80" : "border-[#f2f3ff] bg-white/80"
                }`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#001b44] text-xs font-bold text-white">{s.n}</span>
                <div>
                  <p className="font-medium text-[#001b44]">{s.title}</p>
                  <p className="mt-0.5 text-sm text-[#434750]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl bg-[#f2f3ff] p-6">
          <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Summary</p>
          <p className="font-heading text-lg font-normal text-[#001b44]">Draft escrow</p>
          <p className="text-sm leading-relaxed text-[#434750]">Funds stay in EthiTrust until delivery is confirmed or a dispute is resolved.</p>
          <ul className="space-y-2 border-t border-[#dae2fd] pt-4 text-sm text-[#434750]">
            <li className="flex justify-between"><span>Platform fee</span><span className="font-medium text-[#001b44]">~1%</span></li>
            <li className="flex justify-between"><span>AI screening</span><span className="font-medium text-[#00732c]">Included</span></li>
          </ul>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/escrow/payment" className="rounded-xl bg-[#002f6c] py-3.5 text-center text-sm font-semibold text-white">
              Continue to funding
            </Link>
            <Link href="/dashboard/user" className="rounded-xl border border-[#c4c6d2] bg-white py-3.5 text-center text-sm font-semibold text-[#001b44]">
              Save draft
            </Link>
          </div>
        </aside>
      </div>
    </UserShell>
  );
}
