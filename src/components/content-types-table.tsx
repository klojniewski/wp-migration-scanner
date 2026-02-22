"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { ComplexityLevel, ContentType, TaxonomyRef } from "@/types";

const COMPLEXITY_CONFIG: Record<
  ComplexityLevel,
  { label: string; className: string }
> = {
  simple: {
    label: "Simple",
    className: "bg-[var(--report-green-dim)] text-[var(--report-green)]",
  },
  moderate: {
    label: "Moderate",
    className: "bg-[var(--report-yellow-dim)] text-[var(--report-yellow)]",
  },
  complex: {
    label: "Complex",
    className: "bg-[var(--report-red-dim)] text-[var(--report-red)]",
  },
};

function TaxonomyModal({
  tax,
  onClose,
}: {
  tax: TaxonomyRef;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative z-10 w-80 max-h-[70vh] bg-card border border-border rounded-lg shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between py-3 px-4 border-b border-border">
          <span className="text-sm font-medium text-foreground">
            {tax.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {tax.count} total
            </span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto py-2 px-4">
          {tax.terms.map((term, i) => (
            <li
              key={`${i}-${term}`}
              className="text-sm text-muted-foreground py-1.5 border-b border-border last:border-b-0"
            >
              {term}
            </li>
          ))}
        </ul>
        {tax.count > tax.terms.length && (
          <div className="py-2.5 px-4 border-t border-border">
            <span className="text-xs text-muted-foreground italic">
              and {tax.count - tax.terms.length} more
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TaxonomyBadge({
  tax,
  onOpen,
}: {
  tax: TaxonomyRef;
  onOpen: (tax: TaxonomyRef) => void;
}) {
  const hasTerms = tax.terms.length > 0;

  return (
    <button
      type="button"
      onClick={hasTerms ? () => onOpen(tax) : undefined}
      className={`text-xs font-mono py-0.5 px-2 rounded-md bg-secondary text-muted-foreground whitespace-nowrap border-0 ${
        hasTerms
          ? "cursor-pointer hover:bg-accent hover:text-foreground transition-colors"
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
    <section className="py-8 border-b border-border">
      <div className="flex items-baseline justify-between mb-1.5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Content Structure
        </h2>
        <span className="text-xs text-muted-foreground font-mono">
          {sorted.length} types · {totalItems.toLocaleString()} items
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        Document types detected via REST API with item counts, taxonomy
        relationships, and migration complexity estimate per type.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 border border-border rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground bg-secondary border-b border-border w-[22%]">
                Content Type
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground bg-secondary border-b border-border w-[12%]">
                Items
              </th>
              {hasComplexity && (
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground bg-secondary border-b border-border w-[10%]">
                  Complexity
                </th>
              )}
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground bg-secondary border-b border-border w-[28%]">
                Taxonomies
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground bg-secondary border-b border-border w-[28%]">
                Samples
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ct, i) => {
              const barWidth = Math.max(
                1,
                Math.round((ct.count / maxCount) * 100)
              );
              return (
                <tr key={ct.slug} className="hover:bg-secondary/50 transition-colors">
                  <td
                    className={`py-3 px-4 text-sm align-top ${
                      i < sorted.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      {ct.name}
                      {ct.isEstimate && (
                        <span className="text-muted-foreground text-xs">~</span>
                      )}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 text-sm align-top ${
                      i < sorted.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm text-foreground">
                        {ct.count.toLocaleString()}
                      </span>
                      <div className="flex-1 max-w-16 h-1 bg-secondary rounded-full">
                        <div
                          className="h-full bg-foreground/30 rounded-full"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {hasComplexity && (
                    <td
                      className={`py-3 px-4 text-sm align-top ${
                        i < sorted.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      {ct.complexity ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium py-0.5 px-2 rounded-md ${
                            COMPLEXITY_CONFIG[ct.complexity.level].className
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {ct.complexity.builder ||
                            COMPLEXITY_CONFIG[ct.complexity.level].label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  )}
                  <td
                    className={`py-3 px-4 text-sm align-top ${
                      i < sorted.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex flex-wrap gap-1">
                      {ct.taxonomies.length > 0 ? (
                        ct.taxonomies.map((tax) => (
                          <TaxonomyBadge
                            key={tax.slug}
                            tax={tax}
                            onOpen={setActiveTax}
                          />
                        ))
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground">
                          -
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={`py-3 px-4 text-sm align-top ${
                      i < sorted.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    {ct.samples.length > 0 ? (
                      <ul className="list-none text-xs text-muted-foreground">
                        {ct.samples.slice(0, 3).map((s, j) => (
                          <li
                            key={j}
                            className="py-px whitespace-nowrap overflow-hidden text-ellipsis max-w-56"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
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
