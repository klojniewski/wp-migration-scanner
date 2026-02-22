"use client";

import type { ScanResult } from "@/types";
import { AlertTriangle } from "lucide-react";

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

  const sourcesLabel =
    sources.length > 0
      ? sources.join(", ").replace(/, ([^,]*)$/, " and $1")
      : "limited public data";

  return (
    <div className="mt-8 rounded-lg border border-[var(--report-yellow-dim)] bg-[var(--report-yellow-dim)] px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[var(--report-yellow)] mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--report-yellow)] mb-0.5">
            Limited scan - WordPress REST API is not accessible
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed m-0">
            This site blocks the{" "}
            <code className="font-mono text-xs text-foreground/70">/wp-json</code>{" "}
            endpoint, so content types, item counts, and taxonomy data may be
            incomplete. Results below are built from {sourcesLabel}. A full audit
            with admin access would reveal the complete picture.
          </p>
        </div>
      </div>
    </div>
  );
}
