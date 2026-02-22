"use client";

interface ScanWarningsProps {
  errors: string[];
}

export function ScanWarnings({ errors }: ScanWarningsProps) {
  if (errors.length === 0) return null;

  return (
    <section className="py-10 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Scan Warnings
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {errors.map((err, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 py-2.5 px-4 bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--report-text-secondary)] font-mono"
          >
            <span className="text-[var(--report-yellow)]">⚠</span>
            {err}
          </div>
        ))}
      </div>
    </section>
  );
}
