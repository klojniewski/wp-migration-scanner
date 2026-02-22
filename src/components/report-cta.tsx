"use client";

export function ReportCTA() {
  return (
    <section className="py-12 pb-14 text-center">
      <div className="bg-gradient-to-br from-[var(--report-surface-2)] to-[var(--report-surface)] border border-[var(--report-border-light)] rounded-2xl p-10">
        <div className="text-[22px] font-bold mb-2 tracking-[-0.02em]">
          Ready to plan your migration?
        </div>
        <div className="text-[14px] text-[var(--report-text-secondary)] mb-6 max-w-[480px] mx-auto">
          Get a full technical audit and migration blueprint with timeline, effort estimate, and content model recommendation.
        </div>
        <a
          href="https://pagepro.co/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-3 px-7 bg-[var(--report-accent)] text-white text-[14px] font-semibold rounded-lg no-underline transition-all hover:bg-[#d12e31] hover:shadow-[0_4px_20px_var(--report-accent-glow)]"
        >
          Book Free Consultation →
        </a>
      </div>
    </section>
  );
}
