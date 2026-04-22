import { Camera, Check, IdCard, Upload } from "lucide-react";
import { UserShell } from "@/components/user-shell";

const phases = [
  { n: 1, label: "Identity", state: "current" as const },
  { n: 2, label: "Liveness", state: "upcoming" as const },
  { n: 3, label: "Review", state: "upcoming" as const },
];

export default function KycPage() {
  return (
    <UserShell>
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#d8e2ff] text-[#002f6c]">
            <IdCard className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Identity · Figma 2:3745</p>
            <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">KYC verification</h1>
            <p className="mt-1 text-base text-[#434750]">Upload Fayda ID and complete a short liveness check.</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-heading text-lg font-normal text-[#001b44]">
            <IdCard className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
            National ID (Fayda)
          </h2>
          <p className="mt-2 text-sm text-[#434750]">PDF or clear photo, all four corners visible, under 10MB.</p>
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dae2fd] bg-[#faf8ff] px-6 py-14 transition-colors hover:border-[#002f6c]/40">
            <Upload className="size-8 text-[#002f6c]" strokeWidth={1.5} aria-hidden />
            <span className="mt-3 text-sm font-semibold text-[#002f6c]">Tap to upload</span>
            <span className="mt-1 text-xs text-[#64748b]">or drag a file here</span>
            <input type="file" accept="image/*,.pdf" className="sr-only" />
          </label>
        </section>

        <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-heading text-lg font-normal text-[#001b44]">
            <Camera className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
            Selfie / liveness
          </h2>
          <p className="mt-2 text-sm text-[#434750]">We&apos;ll ask you to turn your head slowly — takes under a minute.</p>
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dae2fd] bg-[#faf8ff] px-6 py-14 transition-colors hover:border-[#002f6c]/40">
            <Camera className="size-8 text-[#002f6c]" strokeWidth={1.5} aria-hidden />
            <span className="mt-3 text-sm font-semibold text-[#002f6c]">Start capture</span>
            <span className="mt-1 text-xs text-[#64748b]">Camera permission required</span>
            <input type="file" accept="image/*" capture="user" className="sr-only" />
          </label>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="rounded-xl bg-[#002f6c] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,47,108,0.2)]">
          Submit for review
        </button>
        <p className="flex items-center text-sm text-[#434750]">Typical review time: under 24 hours.</p>
      </div>
    </UserShell>
  );
}
