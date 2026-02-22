"use client";

import type { UrlStructure } from "@/types";

interface UrlStructureCardProps {
  urlStructure: UrlStructure;
}

export function UrlStructureCard({ urlStructure }: UrlStructureCardProps) {
  return (
    <section className="py-8 border-b border-border">
      <div className="flex items-baseline justify-between mb-1.5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          URL Structure
        </h2>
        <span className="text-xs text-muted-foreground font-mono">
          {urlStructure.totalIndexedUrls.toLocaleString()} indexed URLs ·{" "}
          {urlStructure.patterns.length} patterns
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        URL patterns extracted from sitemap analysis. Each pattern represents a
        content type route that needs redirect mapping during migration.
      </p>

      {urlStructure.patterns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 border border-border rounded-lg overflow-hidden text-sm">
            <thead>
              <tr>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground bg-secondary border-b border-border w-[30%]">
                  Pattern
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground bg-secondary border-b border-border w-[45%]">
                  Example
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground bg-secondary border-b border-border w-[10%]">
                  URLs
                </th>
              </tr>
            </thead>
            <tbody>
              {urlStructure.patterns.map((p, i) => (
                <tr
                  key={i}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <td
                    className={`py-2.5 px-4 align-middle ${
                      i < urlStructure.patterns.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-[var(--report-blue)]">
                      {p.pattern}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-4 align-middle ${
                      i < urlStructure.patterns.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-muted-foreground max-w-80 overflow-hidden text-ellipsis whitespace-nowrap block">
                      {p.example}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-mono text-sm font-medium text-foreground align-middle ${
                      i < urlStructure.patterns.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
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
