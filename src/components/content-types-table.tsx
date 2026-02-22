"use client";

import type { ComplexityLevel, ContentType } from "@/types";

const COMPLEXITY_CONFIG: Record<
  ComplexityLevel,
  { dotColor: string; label: string; bgColor: string; textColor: string }
> = {
  simple: {
    dotColor: "var(--report-green)",
    label: "Simple",
    bgColor: "var(--report-green-dim)",
    textColor: "var(--report-green)",
  },
  moderate: {
    dotColor: "var(--report-yellow)",
    label: "Moderate",
    bgColor: "var(--report-yellow-dim)",
    textColor: "var(--report-yellow)",
  },
  complex: {
    dotColor: "var(--report-red)",
    label: "Complex",
    bgColor: "var(--report-red-dim)",
    textColor: "var(--report-red)",
  },
};

interface ContentTypesTableProps {
  contentTypes: ContentType[];
}

export function ContentTypesTable({ contentTypes }: ContentTypesTableProps) {
  if (contentTypes.length === 0) return null;

  const sorted = [...contentTypes].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0]?.count ?? 1;
  const totalItems = sorted.reduce((sum, ct) => sum + ct.count, 0);
  const hasComplexity = sorted.some((ct) => ct.complexity != null);

  return (
    <section className="py-10 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Content Structure
        </span>
        <span className="text-[12px] text-[var(--report-text-muted)] font-mono">
          {sorted.length} types · {totalItems.toLocaleString()} items
        </span>
      </div>
      <p className="text-[14px] text-[var(--report-text-secondary)] mb-6 max-w-[680px]">
        Document types detected via REST API with item counts, taxonomy relationships, and migration complexity estimate per type.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)] w-[22%]">
                Content Type
              </th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)] w-[12%]">
                Items
              </th>
              {hasComplexity && (
                <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)] w-[10%]">
                  Complexity
                </th>
              )}
              <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)] w-[28%]">
                Taxonomies
              </th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)] w-[28%]">
                Samples
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ct, i) => {
              const barWidth = Math.max(1, Math.round((ct.count / maxCount) * 100));
              return (
                <tr
                  key={ct.slug}
                  className="hover:bg-[var(--report-surface-2)]"
                >
                  <td
                    className={`py-3.5 px-4 text-[14px] align-top ${i < sorted.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                  >
                    <span className="font-semibold text-[var(--report-text)] flex items-center gap-2">
                      {ct.name}
                      {ct.isEstimate && (
                        <span className="text-[var(--report-text-muted)] text-xs">~</span>
                      )}
                    </span>
                  </td>
                  <td
                    className={`py-3.5 px-4 text-[14px] align-top ${i < sorted.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[14px] font-medium text-[var(--report-text)]">
                        {ct.count.toLocaleString()}
                      </span>
                      <div className="flex-1 max-w-[80px] h-1 bg-[var(--report-accent-dim)] rounded-sm">
                        <div
                          className="h-full bg-[var(--report-accent)] rounded-sm"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {hasComplexity && (
                    <td
                      className={`py-3.5 px-4 text-[14px] align-top ${i < sorted.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                    >
                      {ct.complexity ? (
                        <span
                          className="inline-flex items-center gap-[5px] text-[11px] font-medium py-0.5 px-2 rounded"
                          style={{
                            background: COMPLEXITY_CONFIG[ct.complexity.level].bgColor,
                            color: COMPLEXITY_CONFIG[ct.complexity.level].textColor,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: COMPLEXITY_CONFIG[ct.complexity.level].dotColor }}
                          />
                          {ct.complexity.builder || COMPLEXITY_CONFIG[ct.complexity.level].label}
                        </span>
                      ) : (
                        <span className="text-[var(--report-text-muted)]">—</span>
                      )}
                    </td>
                  )}
                  <td
                    className={`py-3.5 px-4 text-[14px] align-top ${i < sorted.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                  >
                    <div className="flex flex-wrap gap-1">
                      {ct.taxonomies.length > 0 ? (
                        ct.taxonomies.map((tax) => (
                          <span
                            key={tax.slug}
                            className="text-[11px] font-mono py-0.5 px-2 rounded bg-[var(--report-surface-3)] text-[var(--report-text-secondary)] whitespace-nowrap"
                          >
                            {tax.name} ({tax.count})
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-mono py-0.5 px-2 rounded bg-[var(--report-surface-3)] text-[var(--report-text-secondary)]">
                          —
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={`py-3.5 px-4 text-[14px] align-top ${i < sorted.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                  >
                    {ct.samples.length > 0 ? (
                      <ul className="list-none text-[12px] text-[var(--report-text-muted)]">
                        {ct.samples.slice(0, 3).map((s, j) => (
                          <li
                            key={j}
                            className="py-px whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[var(--report-text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
