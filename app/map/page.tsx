import { Map } from "lucide-react";
import Link from "next/link";
import { figmaPages } from "@/app/figma-pages";

const areas = ["Public", "Identity", "User", "Escrow", "Disputes", "Risk", "Admin", "Developer"] as const;

export default function MapPage() {
  return (
    <div className="min-h-screen bg-[#faf8ff] px-6 py-10 text-[#001b44]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex size-11 items-center justify-center rounded-xl bg-[#d8e2ff] text-[#002f6c]">
              <Map className="size-6" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
            <h1 className="text-4xl font-extrabold">Figma Page Map</h1>
            <p className="text-[#434750]">Implementation index aligned to the Ethitrust design file.</p>
            </div>
          </div>
          <Link className="rounded-md bg-[#001b44] px-4 py-2 text-sm font-semibold text-white" href="/">
            Back to Landing
          </Link>
        </header>

        <div className="space-y-6">
          {areas.map((area) => {
            const items = figmaPages.filter((page) => page.area === area);
            if (!items.length) return null;

            return (
              <section key={area} className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-bold">{area}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((page) => (
                    <article key={page.nodeId} className="rounded-xl border border-[#e2e8f0] p-4">
                      <p className="text-xs uppercase tracking-wide text-[#434750]">Node {page.nodeId}</p>
                      <p className="mt-1 font-semibold">{page.title}</p>
                      <p className="mt-2 text-sm text-[#434750]">
                        Route:{" "}
                        <code className="rounded bg-[#f2f3ff] px-2 py-1 text-xs text-[#002f6c]">{page.route}</code>
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
