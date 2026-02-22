"use client";

import type { ScanResult } from "@/types";

interface FallbackNoticeProps {
  data: ScanResult;
}

export function FallbackNotice({ data }: FallbackNoticeProps) {
  if (data.apiAvailable) return null;

  const hasSitemap = data.urlStructure !== null;
  const hasContent = data.contentTypes.length > 0;
  const hasPlugins = (data.detectedPlugins?.totalDetected ?? 0) > 0;

  const sources: string[] = [];
  if (hasSitemap) sources.push("sitemap");
  if (hasContent) sources.push("RSS feed");
  if (hasPlugins) sources.push("HTML analysis");

  const sourcesLabel = sources.length > 0
    ? sources.join(", ").replace(/, ([^,]*)$/, " and $1")
    : "limited public data";

  return (
    <div className="mt-8 rounded-[var(--radius)] border border-[var(--report-yellow-dim)] bg-[var(--report-yellow-dim)] px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[var(--report-yellow)] text-[18px] leading-none shrink-0">
          ⚠
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[var(--report-yellow)] mb-1">
            Limited scan — WordPress REST API is not accessible
          </div>
          <p className="text-[13px] text-[var(--report-text-secondary)] leading-relaxed m-0">
            This site blocks the <span className="font-mono text-[12px]">/wp-json</span> endpoint,
            so content types, item counts, and taxonomy data may be incomplete.
            Results below are built from {sourcesLabel}.
            A full audit with admin access would reveal the complete picture.
          </p>
        </div>
      </div>
    </div>
  );
}
