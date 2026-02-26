"use client";

import { useState } from "react";
import type { ScanResult } from "@/types";

interface StatsRowProps {
  data: ScanResult;
}

export function StatsRow({ data }: StatsRowProps) {
  const totalItems = data.contentTypes.reduce((sum, ct) => sum + ct.count, 0);
  const langCount = data.urlStructure?.multilingual?.languages.length ?? 0;
  const indexedUrls = data.urlStructure?.totalIndexedUrls ?? 0;

  const stats = [
    {
      value: data.contentTypes.length,
      label: "Content Types",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
          <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
          <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
        </svg>
      ),
      tooltip: data.apiAvailable
        ? "Discovered via the WordPress REST API (/wp-json/wp/v2/types), excluding internal types like attachments and nav menus."
        : "Inferred from sitemap URL patterns and RSS feed data (REST API was unavailable).",
    },
    {
      value: totalItems.toLocaleString(),
      label: "Total Items",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
          <path d="M14 2v5a1 1 0 0 0 1 1h5" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
      ),
      tooltip: data.apiAvailable
        ? "Sum of items across all content types, using counts from the REST API X-WP-Total header."
        : "Sum of URLs found per content type group in the XML sitemap.",
    },
    {
      value: langCount > 0 ? langCount : 1,
      label: langCount > 1 ? "Languages" : "Language",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 8 6 6" />
          <path d="m4 14 6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="m22 22-5-10-5 10" />
          <path d="M14 18h6" />
        </svg>
      ),
      tooltip: langCount > 1
        ? `Detected ${langCount} language versions via URL prefixes (${data.urlStructure?.multilingual?.languages.join(", ")}).`
        : "No multilingual URL structure detected (e.g. /en/, /fr/ prefixes). Counted as single language.",
    },
    {
      value: indexedUrls > 0 ? indexedUrls.toLocaleString() : "—",
      label: "Indexed URLs",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
          <line x1="8" x2="16" y1="12" y2="12" />
        </svg>
      ),
      tooltip: indexedUrls > 0
        ? "Total URLs found in the site's XML sitemap(s) — wp-sitemap.xml, sitemap.xml, or sitemap_index.xml."
        : "No XML sitemap found. URLs could not be counted.",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-px bg-[var(--border)] rounded-[var(--radius)] my-8 max-sm:grid-cols-2">
      {stats.map((stat) => (
        <StatCell key={stat.label} value={stat.value} label={stat.label} icon={stat.icon} tooltip={stat.tooltip} />
      ))}
    </div>
  );
}

function StatCell({ value, label, icon, tooltip }: { value: string | number; label: string; icon: React.ReactNode; tooltip: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`bg-[var(--report-surface)] py-5 px-6 text-center relative first:rounded-l-[var(--radius)] last:rounded-r-[var(--radius)] max-sm:first:rounded-l-none max-sm:last:rounded-r-none max-sm:[&:nth-child(1)]:rounded-tl-[var(--radius)] max-sm:[&:nth-child(2)]:rounded-tr-[var(--radius)] max-sm:[&:nth-child(3)]:rounded-bl-[var(--radius)] max-sm:[&:nth-child(4)]:rounded-br-[var(--radius)] ${showTooltip ? "z-20" : ""}`}>
      <div className="flex justify-center mb-1.5 text-[var(--report-text-muted)]">
        {icon}
      </div>
      <div className="text-[32px] font-bold tracking-[-0.03em] text-[var(--report-text)] max-sm:text-[24px]">
        {value}
      </div>
      <div className="relative z-10 text-[12px] text-[var(--report-text-muted)] uppercase tracking-[0.06em] mt-1 flex items-center justify-center gap-1">
        {label}
        <span
          className="relative inline-flex"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip((prev) => !prev)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-[var(--report-text-muted)] opacity-50 hover:opacity-100 cursor-help transition-opacity"
          >
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <text
              x="7"
              y="10.5"
              textAnchor="middle"
              fill="currentColor"
              fontSize="9"
              fontFamily="system-ui, sans-serif"
              fontWeight="500"
            >
              i
            </text>
          </svg>
          {showTooltip && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 text-[11px] leading-snug normal-case tracking-normal text-left text-[var(--report-text)] bg-[var(--report-surface-3)] border border-[var(--border)] rounded-md shadow-lg z-50 pointer-events-none">
              {tooltip}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
