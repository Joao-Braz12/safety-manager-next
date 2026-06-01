import type { ReactNode } from "react";
import { BrandLink } from "@/components/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-bone)]">
      {/* Editorial side panel */}
      <aside className="relative lg:w-[44%] xl:w-[42%] bg-[var(--color-ink)] text-white overflow-hidden flex flex-col">
        {/* Background imagery */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-ink)]/30 via-[var(--color-ink)]/60 to-[var(--color-ink)]" />
        <div className="noise" />

        {/* Top bar */}
        <header className="relative z-10 flex items-center justify-between p-8">
          <BrandLink tone="white" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            v1.0 / EU
          </span>
        </header>

        {/* Hero typography */}
        <div className="relative z-10 flex-1 flex flex-col justify-end p-8 lg:p-12">
          <div className="mb-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-acciona-red)] mb-6">
              <span className="inline-block w-2 h-2 bg-[var(--color-acciona-red)] mr-2 pulse-rec" />
              Operational Safety · Live
            </div>
            <h1 className="font-display font-black text-[10vw] lg:text-[5.2rem] xl:text-[6rem] leading-[0.92] tracking-[-0.04em] text-white">
              Zero
              <br />
              <span className="text-[var(--color-acciona-red)]">incidents.</span>
              <br />
              By design.
            </h1>
            <p className="mt-8 max-w-md text-white/70 text-[15px] leading-relaxed">
              A unified platform for safety briefings, video training and audit-grade
              compliance — built for the people who actually build things.
            </p>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-3 gap-px bg-white/15 mb-8 max-w-md">
            {[
              { k: "1,284", l: "Briefings delivered" },
              { k: "98.4%", l: "Completion rate" },
              { k: "0", l: "Lost-time incidents" },
            ].map((s) => (
              <div key={s.l} className="bg-[var(--color-ink)] p-4">
                <div className="font-display font-bold text-2xl text-white">{s.k}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 mt-1">
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          {/* Footer meta */}
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 pt-6 border-t border-white/10">
            <span>ISO 45001 · Certified</span>
            <span>{new Date().getFullYear()} · Acciona, S.A.</span>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
