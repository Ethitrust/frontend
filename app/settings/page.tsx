import { Bell, KeyRound, MonitorSmartphone, Settings as SettingsIcon, Shield } from "lucide-react";
import { UserShell } from "@/components/user-shell";

const sections = [
  {
    title: "Security",
    body: "Multi-factor authentication, trusted devices, and session revoke.",
    icon: Shield,
  },
  {
    title: "Notifications",
    body: "Escrow events, dispute updates, and weekly statements.",
    icon: Bell,
  },
  {
    title: "API keys",
    body: "Rotate keys and manage webhooks (business tier).",
    icon: KeyRound,
  },
  {
    title: "Sessions",
    body: "See where you are signed in and sign out remotely.",
    icon: MonitorSmartphone,
  },
];

export default function SettingsPage() {
  return (
    <UserShell>
      <header className="mb-8 flex items-start gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#d8e2ff] text-[#002f6c]">
          <SettingsIcon className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">Settings</h1>
          <p className="mt-1 text-base text-[#434750]">Security, alerts, and developer preferences.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <section key={s.title} className="rounded-3xl border border-[#e8eaf2] bg-white p-6 transition-shadow hover:shadow-md">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f2f3ff] text-[#002f6c]">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="font-heading text-base font-normal text-[#001b44]">{s.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#434750]">{s.body}</p>
                  <button type="button" className="mt-4 text-sm font-semibold text-[#002f6c]">
                    Configure
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </UserShell>
  );
}
