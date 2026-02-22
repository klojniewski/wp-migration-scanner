"use client";

import type { UrlStructure } from "@/types";

interface UrlStructureCardProps {
  urlStructure: UrlStructure;
}

export function UrlStructureCard({ urlStructure }: UrlStructureCardProps) {
  return (
    <section className="py-10 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          URL Structure
        </span>
        <span className="text-[12px] text-[var(--report-text-muted)] font-mono">
          {urlStructure.totalIndexedUrls.toLocaleString()} indexed URLs · {urlStructure.patterns.length} patterns
        </span>
      </div>
      <p className="text-[14px] text-[var(--report-text-secondary)] mb-6 max-w-[680px]">
        URL patterns extracted from sitemap analysis. Each pattern represents a content type route that needs redirect mapping during migration.
      </p>

      {urlStructure.patterns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden text-[13px]">
            <thead>
              <tr>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)] w-[30%]">
                  Pattern
                </th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)] w-[45%]">
                  Example
                </th>
                <th className="text-right py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)] w-[10%]">
                  URLs
                </th>
              </tr>
            </thead>
            <tbody>
              {urlStructure.patterns.map((p, i) => (
                <tr
                  key={i}
                  className="hover:bg-[var(--report-surface-2)]"
                >
                  <td
                    className={`py-2 px-4 align-middle ${i < urlStructure.patterns.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                  >
                    <span className="font-mono text-[12px] text-[var(--report-blue)]">
                      {p.pattern}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-4 align-middle ${i < urlStructure.patterns.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                  >
                    <span className="font-mono text-[11px] text-[var(--report-text-muted)] max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap block">
                      {p.example}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-4 text-right font-mono font-medium text-[var(--report-text)] align-middle ${i < urlStructure.patterns.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                  >
                    {p.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
