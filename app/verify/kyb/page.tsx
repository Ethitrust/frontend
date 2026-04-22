import { Building2, Check, FileStack, Upload } from "lucide-react";
import { UserShell } from "@/components/user-shell";

const phases = [
  { n: 1, label: "Business profile", state: "current" as const },
  { n: 2, label: "Documents", state: "upcoming" as const },
  { n: 3, label: "Signatory", state: "upcoming" as const },
];

export default function KybPage() {
  return (
    <UserShell>
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#d0e4ff] text-[#002f6c]">
            <Building2 className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Business · Figma 2:3509</p>
            <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">KYB verification</h1>
            <p className="mt-1 text-base text-[#434750]">Register your company for higher limits and team seats.</p>
          </div>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-3">
        {phases.map((p) => (
          <div
            key={p.n}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              p.state === "current"
                ? "bg-[#001b44] text-white"
                : p.state === "done"
                  ? "border border-[#69ff87]/50 bg-[#f2fff6] text-[#00732c]"
                  : "border border-[#e2e8f0] bg-white text-[#64748b]"
            }`}
          >
            {p.state === "done" ? (
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
            ) : (
              <span className={`flex size-5 items-center justify-center rounded-full text-[11px] ${p.state === "current" ? "bg-white/20" : "bg-[#f2f3ff]"}`}>
                {p.n}
              </span>
            )}
            {p.label}
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-normal text-[#001b44]">
          <FileStack className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
          Company details
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Registered trade name</span>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
              placeholder="Blue Nile Logistics PLC"
            />
          </label>
          <label className="block">
            <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">TIN</span>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
              placeholder="000012345678"
            />
          </label>
          <label className="block">
            <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Industry</span>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
              placeholder="Logistics"
            />
          </label>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Business registration</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dae2fd] bg-[#faf8ff] px-4 py-10">
              <Upload className="size-7 text-[#002f6c]" strokeWidth={1.5} aria-hidden />
              <span className="mt-2 text-sm font-semibold text-[#002f6c]">Upload certificate</span>
              <input type="file" className="sr-only" />
            </label>
          </div>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Authorized signatory ID</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dae2fd] bg-[#faf8ff] px-4 py-10">
              <Upload className="size-7 text-[#002f6c]" strokeWidth={1.5} aria-hidden />
              <span className="mt-2 text-sm font-semibold text-[#002f6c]">Upload ID scan</span>
              <input type="file" className="sr-only" />
            </label>
          </div>
        </div>

        <button type="button" className="mt-8 rounded-xl bg-[#002f6c] px-8 py-3.5 text-sm font-semibold text-white">
          Submit business profile
        </button>
      </section>
    </UserShell>
  );
}
