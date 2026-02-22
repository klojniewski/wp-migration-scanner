"use client";

import { useCallback, useEffect, useState } from "react";
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

function layoutFor(mode: "inline" | "full") {
  const NODE_H = mode === "full" ? 44 : 32;
  const NODE_GAP = mode === "full" ? 10 : 6;
  const LEFT_W = mode === "full" ? 220 : 130;
  const RIGHT_W = mode === "full" ? 220 : 130;
  const SVG_W = mode === "full" ? 800 : 420;
  const RIGHT_X = SVG_W - RIGHT_W;
  const PAD_TOP = mode === "full" ? 12 : 8;
  const FONT_NAME = mode === "full" ? 11 : 10;
  const FONT_SUB = mode === "full" ? 9 : 8;
  const TEXT_X = mode === "full" ? 14 : 10;
  const TEXT_Y1 = mode === "full" ? 18 : 14;
  const TEXT_Y2 = mode === "full" ? 32 : 26;
  const ACCENT_W = mode === "full" ? 4 : 3;
  const ACCENT_PAD = mode === "full" ? 8 : 6;
  const RX = mode === "full" ? 6 : 5;
  const TRUNC_L = mode === "full" ? 22 : 14;
  const TRUNC_R = mode === "full" ? 20 : 14;
  return { NODE_H, NODE_GAP, LEFT_W, RIGHT_W, SVG_W, RIGHT_X, PAD_TOP, FONT_NAME, FONT_SUB, TEXT_X, TEXT_Y1, TEXT_Y2, ACCENT_W, ACCENT_PAD, RX, TRUNC_L, TRUNC_R };
}

const TYPE_COLORS = [
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fbbf24", // amber
  "#fb923c", // orange
  "#fb7185", // rose
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#f472b6", // pink
  "#a3e635", // lime
  "#38bdf8", // sky
];

function strokeWidthForCount(count: number): number {
  return Math.min(0.8 + Math.log2(Math.max(count, 1)) * 0.4, 3);
}

export function ContentRelationshipsCard({ contentTypes }: ContentRelationshipsCardProps) {
  const [hoverType, setHoverType] = useState<number | null>(null);
  const [hoverTax, setHoverTax] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeFullscreen(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen, closeFullscreen]);

  const taxonomies = buildTaxonomyNodes(contentTypes);

  if (taxonomies.length === 0) return null;

  const L = layoutFor(fullscreen ? "full" : "inline");
  const isHovering = hoverType !== null || hoverTax !== null;

  const leftCount = contentTypes.length;
  const rightCount = taxonomies.length;
  const leftColH = leftCount * (L.NODE_H + L.NODE_GAP) - L.NODE_GAP;
  const rightColH = rightCount * (L.NODE_H + L.NODE_GAP) - L.NODE_GAP;

  const leftTop = L.PAD_TOP + Math.max(0, (rightColH - leftColH) / 2);
  const rightTop = L.PAD_TOP + Math.max(0, (leftColH - rightColH) / 2);
  const svgH = Math.max(leftColH, rightColH) + L.PAD_TOP * 2;

  const typeY = (i: number) => leftTop + i * (L.NODE_H + L.NODE_GAP);
  const taxY = (i: number) => rightTop + i * (L.NODE_H + L.NODE_GAP);

  const typeIndex = new Map(contentTypes.map((ct, i) => [ct.slug, i]));
  const taxIndex = new Map(taxonomies.map((t, i) => [t.slug, i]));

  const shared = taxonomies.filter((t) => t.usedBy.length >= 2);
  const orphaned = taxonomies.filter((t) => t.count === 0);

  const connections: {
    ctIdx: number;
    taxIdx: number;
    taxCount: number;
    isShared: boolean;
  }[] = [];

  for (const ct of contentTypes) {
    const ci = typeIndex.get(ct.slug)!;
    for (const tax of ct.taxonomies) {
      const ti = taxIndex.get(tax.slug);
      if (ti === undefined) continue;
      const node = taxonomies[ti];
      connections.push({ ctIdx: ci, taxIdx: ti, taxCount: node.count, isShared: node.usedBy.length >= 2 });
    }
  }

  // Build sets of connected indices for hover highlighting
  const connectedTaxForType = new Map<number, Set<number>>();
  const connectedTypeForTax = new Map<number, Set<number>>();
  for (const { ctIdx, taxIdx } of connections) {
    if (!connectedTaxForType.has(ctIdx)) connectedTaxForType.set(ctIdx, new Set());
    connectedTaxForType.get(ctIdx)!.add(taxIdx);
    if (!connectedTypeForTax.has(taxIdx)) connectedTypeForTax.set(taxIdx, new Set());
    connectedTypeForTax.get(taxIdx)!.add(ctIdx);
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

      {/* Chart diagram */}
      {renderDiagram()}

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
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 rounded-full" style={{ background: "#60a5fa" }} />
          Tap or hover to trace
        </span>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "var(--report-bg, #0a0a0a)" }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <span className="text-[13px] font-semibold text-[var(--report-text)]">
              Content Relationships
              <span className="ml-2 text-[11px] font-normal text-[var(--report-text-muted)]">
                {contentTypes.length} types &middot; {taxonomies.length} taxonomies
              </span>
            </span>
            <button
              onClick={closeFullscreen}
              className="text-[var(--report-text-muted)] hover:text-[var(--report-text)] text-[20px] leading-none px-2 py-1 rounded hover:bg-[var(--report-surface-2)] transition-colors"
              aria-label="Close fullscreen"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
            {renderDiagram()}
          </div>
          <div className="hidden sm:block px-5 py-2 border-t border-[var(--border)] text-[11px] text-[var(--report-text-muted)]">
            Press <kbd className="px-1 py-0.5 rounded bg-[var(--report-surface-2)] text-[var(--report-text)] text-[10px]">Esc</kbd> to close
          </div>
        </div>
      )}
    </section>
  );

  function renderDiagram() {
    return (
      <div className={fullscreen ? "w-full max-w-[900px]" : "bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] p-3 overflow-x-auto relative group"}>
        {!fullscreen && (
          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-2 right-2 z-10 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity text-[var(--report-text-muted)] hover:text-[var(--report-text)] p-1 rounded hover:bg-[var(--report-surface-2)]"
            aria-label="Open fullscreen"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="10 2 14 2 14 6" />
              <polyline points="6 14 2 14 2 10" />
              <line x1="14" y1="2" x2="9.5" y2="6.5" />
              <line x1="2" y1="14" x2="6.5" y2="9.5" />
            </svg>
          </button>
        )}
        <svg
          viewBox={`0 0 ${L.SVG_W} ${svgH}`}
          className="w-full"
          style={fullscreen ? undefined : { maxWidth: L.SVG_W, margin: "0 auto" }}
          role="img"
          aria-label="Content type and taxonomy relationship diagram"
          onMouseLeave={() => { setHoverType(null); setHoverTax(null); }}
          onClick={(e) => {
            // Tap on empty SVG area clears highlight on touch devices
            if (e.target === e.currentTarget) { setHoverType(null); setHoverTax(null); }
          }}
        >
          {/* Connections */}
          {connections
            .sort((a, b) => Number(a.isShared) - Number(b.isShared))
            .map(({ ctIdx, taxIdx, taxCount }) => {
              const x1 = L.LEFT_W;
              const y1 = typeY(ctIdx) + L.NODE_H / 2;
              const x2 = L.RIGHT_X;
              const y2 = taxY(taxIdx) + L.NODE_H / 2;
              const mx = (x1 + x2) / 2;

              const color = TYPE_COLORS[ctIdx % TYPE_COLORS.length];
              const baseWidth = strokeWidthForCount(taxCount);

              const isActive =
                hoverType === ctIdx ||
                hoverTax === taxIdx;

              let opacity: number;
              let width: number;
              if (!isHovering) {
                opacity = 0.35;
                width = baseWidth;
              } else if (isActive) {
                opacity = 0.85;
                width = baseWidth * 1.3;
              } else {
                opacity = 0.06;
                width = baseWidth;
              }

              return (
                <path
                  key={`c-${ctIdx}-${taxIdx}`}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={width}
                  opacity={opacity}
                  style={{ transition: "opacity 0.15s, stroke-width 0.15s" }}
                />
              );
            })}

          {/* Left column — content types */}
          {contentTypes.map((ct, i) => {
            const y = typeY(i);
            const color = TYPE_COLORS[i % TYPE_COLORS.length];

            const isConnected =
              hoverTax !== null && connectedTypeForTax.get(hoverTax)?.has(i);
            const isDimmed =
              isHovering && hoverType !== i && !isConnected;

            const borderColor =
              isConnected ? color : "var(--border)";
            const borderWidth =
              isConnected || hoverType === i ? 1.5 : 1;

            return (
              <g
                key={`l-${ct.slug}`}
                onMouseEnter={() => { setHoverType(i); setHoverTax(null); }}
                onMouseLeave={() => setHoverType(null)}
                onClick={() => { setHoverType(hoverType === i ? null : i); setHoverTax(null); }}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={0}
                  y={y}
                  width={L.LEFT_W}
                  height={L.NODE_H}
                  rx={L.RX}
                  fill="var(--report-surface-2)"
                  stroke={borderColor}
                  strokeWidth={borderWidth}
                  style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
                />
                {/* Colored accent bar */}
                <rect
                  x={0}
                  y={y + L.ACCENT_PAD}
                  width={L.ACCENT_W}
                  height={L.NODE_H - L.ACCENT_PAD * 2}
                  rx={L.ACCENT_W / 2}
                  fill={color}
                  opacity={isDimmed ? 0.3 : 1}
                  style={{ transition: "opacity 0.15s" }}
                />
                <text
                  x={L.TEXT_X}
                  y={y + L.TEXT_Y1}
                  style={{
                    fontSize: L.FONT_NAME,
                    fontWeight: 600,
                    fill: "var(--report-text)",
                    fontFamily: "var(--font-sans)",
                    opacity: isDimmed ? 0.3 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {truncate(ct.name, L.TRUNC_L)}
                </text>
                <text
                  x={L.TEXT_X}
                  y={y + L.TEXT_Y2}
                  style={{
                    fontSize: L.FONT_SUB,
                    fill: "var(--report-text-muted)",
                    fontFamily: "var(--font-mono)",
                    opacity: isDimmed ? 0.3 : 1,
                    transition: "opacity 0.15s",
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

            const isConnected =
              hoverType !== null && connectedTaxForType.get(hoverType)?.has(i);
            const isDimmed =
              isHovering && hoverTax !== i && !isConnected;

            const highlightColor =
              hoverType !== null
                ? TYPE_COLORS[hoverType % TYPE_COLORS.length]
                : null;

            const borderColor =
              isConnected && highlightColor
                ? highlightColor
                : isOrphaned
                  ? "var(--report-red)"
                  : isShared
                    ? "var(--report-blue)"
                    : "var(--border)";
            const borderWidth =
              isConnected || hoverTax === i ? 1.5 : isShared ? 1.5 : 1;

            return (
              <g
                key={`r-${tax.slug}`}
                onMouseEnter={() => { setHoverTax(i); setHoverType(null); }}
                onMouseLeave={() => setHoverTax(null)}
                onClick={() => { setHoverTax(hoverTax === i ? null : i); setHoverType(null); }}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={L.RIGHT_X}
                  y={y}
                  width={L.RIGHT_W}
                  height={L.NODE_H}
                  rx={L.RX}
                  fill={isShared ? "var(--report-blue-dim)" : "var(--report-surface-2)"}
                  stroke={borderColor}
                  strokeWidth={borderWidth}
                  strokeDasharray={isOrphaned ? "4 2" : "none"}
                  style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
                />
                <text
                  x={L.RIGHT_X + L.TEXT_X}
                  y={y + L.TEXT_Y1}
                  style={{
                    fontSize: L.FONT_NAME,
                    fontWeight: isShared ? 600 : 400,
                    fill: "var(--report-text)",
                    fontFamily: "var(--font-sans)",
                    opacity: isDimmed ? 0.3 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {truncate(tax.name, L.TRUNC_R)}
                </text>
                <text
                  x={L.RIGHT_X + L.TEXT_X}
                  y={y + L.TEXT_Y2}
                  style={{
                    fontSize: L.FONT_SUB,
                    fill: "var(--report-text-muted)",
                    fontFamily: "var(--font-mono)",
                    opacity: isDimmed ? 0.3 : 1,
                    transition: "opacity 0.15s",
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
    );
  }
}
