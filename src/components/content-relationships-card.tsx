"use client";

import type { ContentType } from "@/types";

interface TaxonomyNode {
  slug: string;
  name: string;
  count: number;
  usedBy: string[];
}

interface ContentRelationshipsCardProps {
  contentTypes: ContentType[];
}

function buildTaxonomyNodes(contentTypes: ContentType[]): TaxonomyNode[] {
  const map = new Map<string, TaxonomyNode>();

  for (const ct of contentTypes) {
    for (const tax of ct.taxonomies) {
      const existing = map.get(tax.slug);
      if (existing) {
        existing.usedBy.push(ct.slug);
      } else {
        map.set(tax.slug, {
          slug: tax.slug,
          name: tax.name,
          count: tax.count,
          usedBy: [ct.slug],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const sharedDiff = b.usedBy.length - a.usedBy.length;
    if (sharedDiff !== 0) return sharedDiff;
    return b.count - a.count;
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "\u2026" : text;
}

const NODE_H = 52;
const NODE_GAP = 14;
const LEFT_W = 200;
const RIGHT_W = 200;
const SVG_W = 720;
const RIGHT_X = SVG_W - RIGHT_W;
const PAD_TOP = 16;

export function ContentRelationshipsCard({ contentTypes }: ContentRelationshipsCardProps) {
  const taxonomies = buildTaxonomyNodes(contentTypes);

  if (taxonomies.length === 0) return null;

  const leftCount = contentTypes.length;
  const rightCount = taxonomies.length;
  const leftColH = leftCount * (NODE_H + NODE_GAP) - NODE_GAP;
  const rightColH = rightCount * (NODE_H + NODE_GAP) - NODE_GAP;

  const leftTop = PAD_TOP + Math.max(0, (rightColH - leftColH) / 2);
  const rightTop = PAD_TOP + Math.max(0, (leftColH - rightColH) / 2);
  const svgH = Math.max(leftColH, rightColH) + PAD_TOP * 2;

  const typeY = (i: number) => leftTop + i * (NODE_H + NODE_GAP);
  const taxY = (i: number) => rightTop + i * (NODE_H + NODE_GAP);

  const typeIndex = new Map(contentTypes.map((ct, i) => [ct.slug, i]));
  const taxIndex = new Map(taxonomies.map((t, i) => [t.slug, i]));

  const shared = taxonomies.filter((t) => t.usedBy.length >= 2);
  const orphaned = taxonomies.filter((t) => t.count === 0);

  const connections: {
    ctIdx: number;
    taxIdx: number;
    isShared: boolean;
  }[] = [];

  for (const ct of contentTypes) {
    const ci = typeIndex.get(ct.slug)!;
    for (const tax of ct.taxonomies) {
      const ti = taxIndex.get(tax.slug);
      if (ti === undefined) continue;
      const node = taxonomies[ti];
      connections.push({ ctIdx: ci, taxIdx: ti, isShared: node.usedBy.length >= 2 });
    }
  }

  return (
    <section className="py-10 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Content Relationships
        </span>
        <span className="text-[12px] text-[var(--report-text-muted)] font-mono">
          {contentTypes.length} types · {taxonomies.length} taxonomies
          {shared.length > 0 && (
            <span className="text-[var(--report-blue)]">
              {" "}&middot; {shared.length} shared
            </span>
          )}
          {orphaned.length > 0 && (
            <span className="text-[var(--report-red)]">
              {" "}&middot; {orphaned.length} empty
            </span>
          )}
        </span>
      </div>
      <p className="text-[14px] text-[var(--report-text-secondary)] mb-6 max-w-[680px]">
        How {contentTypes.length} content{" "}
        {contentTypes.length === 1 ? "type connects" : "types connect"} through{" "}
        {taxonomies.length}{" "}
        {taxonomies.length === 1 ? "taxonomy" : "taxonomies"}.
      </p>

      <div className="bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${svgH}`}
          className="w-full"
          role="img"
          aria-label="Content type and taxonomy relationship diagram"
        >
          {/* Connections */}
          {connections
            .sort((a, b) => Number(a.isShared) - Number(b.isShared))
            .map(({ ctIdx, taxIdx, isShared }) => {
              const x1 = LEFT_W;
              const y1 = typeY(ctIdx) + NODE_H / 2;
              const x2 = RIGHT_X;
              const y2 = taxY(taxIdx) + NODE_H / 2;
              const mx = (x1 + x2) / 2;

              return (
                <path
                  key={`c-${ctIdx}-${taxIdx}`}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={isShared ? "var(--report-blue)" : "var(--border)"}
                  strokeWidth={isShared ? 2 : 1.5}
                  opacity={isShared ? 0.8 : 0.4}
                />
              );
            })}

          {/* Left column — content types */}
          {contentTypes.map((ct, i) => {
            const y = typeY(i);
            return (
              <g key={`l-${ct.slug}`}>
                <rect
                  x={0}
                  y={y}
                  width={LEFT_W}
                  height={NODE_H}
                  rx={8}
                  fill="var(--report-surface-2)"
                  stroke="var(--border)"
                  strokeWidth={1.5}
                />
                <text
                  x={14}
                  y={y + 22}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fill: "var(--report-text)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {truncate(ct.name, 20)}
                </text>
                <text
                  x={14}
                  y={y + 40}
                  style={{
                    fontSize: 11,
                    fill: "var(--report-text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {ct.count.toLocaleString()} items
                </text>
              </g>
            );
          })}

          {/* Right column — taxonomies */}
          {taxonomies.map((tax, i) => {
            const y = taxY(i);
            const isShared = tax.usedBy.length >= 2;
            const isOrphaned = tax.count === 0;

            return (
              <g key={`r-${tax.slug}`}>
                <rect
                  x={RIGHT_X}
                  y={y}
                  width={RIGHT_W}
                  height={NODE_H}
                  rx={8}
                  fill={isShared ? "var(--report-blue-dim)" : "var(--report-surface-2)"}
                  stroke={
                    isOrphaned
                      ? "var(--report-red)"
                      : isShared
                        ? "var(--report-blue)"
                        : "var(--border)"
                  }
                  strokeWidth={isShared ? 2 : 1.5}
                  strokeDasharray={isOrphaned ? "5 3" : "none"}
                />
                <text
                  x={RIGHT_X + 14}
                  y={y + 22}
                  style={{
                    fontSize: 13,
                    fontWeight: isShared ? 600 : 400,
                    fill: "var(--report-text)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {truncate(tax.name, 18)}
                </text>
                <text
                  x={RIGHT_X + 14}
                  y={y + 40}
                  style={{
                    fontSize: 11,
                    fill: "var(--report-text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {tax.count} {tax.count === 1 ? "term" : "terms"} &middot;{" "}
                  {tax.usedBy.length} {tax.usedBy.length === 1 ? "type" : "types"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[11px] text-[var(--report-text-muted)]">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border-2"
            style={{ borderColor: "var(--report-blue)", background: "var(--report-blue-dim)" }}
          />
          Shared taxonomy
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border-2 border-dashed"
            style={{ borderColor: "var(--report-red)" }}
          />
          Empty (0 terms)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ border: "1.5px solid var(--border)" }}
          />
          Exclusive to one type
        </span>
      </div>
    </section>
  );
}
