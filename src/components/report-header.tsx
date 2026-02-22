"use client";

import type { ScanResult } from "@/types";
import { ExternalLink } from "lucide-react";

interface ReportHeaderProps {
  data: ScanResult;
}

function getBadges(data: ScanResult) {
  const badges: { label: string; variant: "default" | "warning" | "success" | "destructive" | "info" }[] = [];

  badges.push({
    label: data.apiAvailable ? "REST API Open" : "Fallback Mode",
    variant: data.apiAvailable ? "success" : "warning",
  });

  const builder = data.contentTypes.find((ct) => ct.complexity?.builder);
  if (builder?.complexity?.builder) {
    badges.push({ label: builder.complexity.builder, variant: "destructive" });
  }

  if (data.urlStructure?.multilingual) {
    const ml = data.urlStructure.multilingual;
    const pluginName = data.detectedPlugins?.plugins.find(
      (p) => p.category === "multilingual"
    )?.name;
    const label = pluginName
      ? `${pluginName} · ${ml.languages.length} Languages`
      : `${ml.languages.length} Languages`;
    badges.push({ label, variant: "info" });
  }

  const seo = data.detectedPlugins?.plugins.find((p) => p.category === "seo");
  if (seo) {
    badges.push({ label: seo.name, variant: "default" });
  }

  if (data.detectedPlugins && data.detectedPlugins.totalDetected > 5) {
    badges.push({
      label: `${data.detectedPlugins.totalDetected} Plugins`,
      variant: "warning",
    });
  }

  return badges;
}

const BADGE_STYLES: Record<string, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-[var(--report-green-dim)] text-[var(--report-green)]",
  warning: "bg-[var(--report-yellow-dim)] text-[var(--report-yellow)]",
  destructive: "bg-[var(--report-red-dim)] text-[var(--report-red)]",
  info: "bg-[var(--report-blue-dim)] text-[var(--report-blue)]",
};

export function ReportHeader({ data }: ReportHeaderProps) {
  const scannedAt = new Date(data.scannedAt);
  const dateStr = scannedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = scannedAt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const displayUrl = data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const badges = getBadges(data);

  return (
    <header className="pt-10 pb-6 border-b border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-[var(--report-accent)] rounded-[5px] flex items-center justify-center text-xs font-bold text-foreground">
            P
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            WordPress Migration Scanner
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {dateStr} · {timeStr}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {displayUrl}
        </h1>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="sr-only">Open site in new tab</span>
        </a>
      </div>

      <div className="flex gap-2 flex-wrap mt-3">
        {badges.map((badge, i) => (
          <span
            key={i}
            className={`text-xs font-medium px-2.5 py-1 rounded-md font-mono ${BADGE_STYLES[badge.variant] ?? BADGE_STYLES.default}`}
          >
            {badge.label}
          </span>
        ))}
      </div>
    </header>
  );
}
