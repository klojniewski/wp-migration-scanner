"use client";

import { useState, useEffect } from "react";
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

function TaxonomyModal({ tax, onClose }: { tax: TaxonomyRef; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-[320px] max-h-[70vh] bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between py-3 px-4 border-b border-[var(--border)]">
          <span className="text-[13px] font-semibold text-[var(--report-text)]">
            {tax.name}
          </span>
          <span className="text-[12px] font-mono text-[var(--report-text-muted)]">
            {tax.count} total
          </span>
        </div>
        <ul className="flex-1 overflow-y-auto py-2 px-4 list-none">
          {tax.terms.map((term, i) => (
            <li
              key={`${i}-${term}`}
              className="text-[13px] text-[var(--report-text-secondary)] py-1 border-b border-[var(--border)] last:border-b-0"
            >
              {term}
            </li>
          ))}
        </ul>
        {tax.count > tax.terms.length && (
          <div className="py-2.5 px-4 border-t border-[var(--border)]">
            <span className="text-[12px] text-[var(--report-text-muted)] italic">
              and {tax.count - tax.terms.length} more
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TaxonomyBadge({ tax, onOpen }: { tax: TaxonomyRef; onOpen: (tax: TaxonomyRef) => void }) {
  const hasTerms = tax.terms.length > 0;

  return (
    <button
      type="button"
      onClick={hasTerms ? () => onOpen(tax) : undefined}
      className={`text-[11px] font-mono py-0.5 px-2 rounded bg-[var(--report-surface-3)] text-[var(--report-text-secondary)] whitespace-nowrap border-0 ${
        hasTerms
          ? "cursor-pointer hover:bg-[var(--report-surface-2)] hover:text-[var(--report-text)] transition-colors"
          : "cursor-default"
      }`}
    >
      {tax.name} ({tax.count})
    </button>
  );
}

interface ContentTypesTableProps {
  contentTypes: ContentType[];
}

export function ContentTypesTable({ contentTypes }: ContentTypesTableProps) {
  const [activeTax, setActiveTax] = useState<TaxonomyRef | null>(null);

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
                          <TaxonomyBadge key={tax.slug} tax={tax} onOpen={setActiveTax} />
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
      {activeTax && (
        <TaxonomyModal tax={activeTax} onClose={() => setActiveTax(null)} />
      )}
    </section>
  );
}
