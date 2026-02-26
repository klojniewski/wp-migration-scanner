"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const ShaderBackground = dynamic(
  () =>
    import("./shader-background").then((mod) => ({
      default: mod.ShaderBackground,
    })),
  { ssr: false }
);

export function ReportCTA() {
  const [hovered, setHovered] = useState(false);

  return (
    <section className="py-12 pb-14 text-center">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--report-surface-2)] to-[var(--report-surface)] border border-[var(--report-border-light)]">
        <ShaderBackground
          className={`absolute inset-0 block w-full h-full transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
        />
        <div className="relative z-10 p-10">
          <div
            className={`text-[22px] font-bold mb-2 tracking-[-0.02em] transition-colors duration-500 ${hovered ? "text-white" : ""}`}
          >
            Ready to plan your migration?
          </div>
          <div
            className={`text-[14px] mb-6 max-w-[480px] mx-auto transition-colors duration-500 ${hovered ? "text-white" : "text-[var(--report-text-secondary)]"}`}
          >
            Get a full technical audit and migration blueprint with timeline,
            effort estimate, and content model recommendation.
          </div>
          <a
            href="https://pagepro.co/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-3 px-7 bg-[var(--report-accent)] text-white text-[14px] font-semibold rounded-lg no-underline transition-all hover:bg-[#d12e31] hover:shadow-[0_4px_20px_var(--report-accent-glow)]"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            Book Free Consultation →
          </a>
        </div>
      </div>
    </section>
  );
}
