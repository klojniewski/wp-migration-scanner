"use client";

import { useState, useRef, useEffect } from "react";
import type { ComplexityLevel, ContentType, TaxonomyRef } from "@/types";

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

function TaxonomyBadge({ tax }: { tax: TaxonomyRef }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hasTerms = tax.terms.length > 0;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={hasTerms ? () => setOpen((o) => !o) : undefined}
        className={`text-[11px] font-mono py-0.5 px-2 rounded bg-[var(--report-surface-3)] text-[var(--report-text-secondary)] whitespace-nowrap border-0 ${
          hasTerms
            ? "cursor-pointer hover:bg-[var(--report-surface-2)] hover:text-[var(--report-text)] transition-colors"
            : "cursor-default"
        }`}
      >
        {tax.name} ({tax.count})
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] max-w-[260px] bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-lg">
          <div className="py-2 px-3 border-b border-[var(--border)]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)]">
              {tax.name}
            </span>
          </div>
          <ul className="max-h-[200px] overflow-y-auto py-1.5 px-3 list-none">
            {tax.terms.map((term, i) => (
              <li
                key={`${i}-${term}`}
                className="text-[12px] text-[var(--report-text-secondary)] py-0.5"
              >
                {term}
              </li>
            ))}
          </ul>
          {tax.count > tax.terms.length && (
            <div className="py-1.5 px-3 border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--report-text-muted)] italic">
                and {tax.count - tax.terms.length} more
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
                          <TaxonomyBadge key={tax.slug} tax={tax} />
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
