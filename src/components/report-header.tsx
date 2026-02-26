"use client";

import type { ScanResult } from "@/types";

interface ReportHeaderProps {
  data: ScanResult;
}

function getBadges(data: ScanResult) {
  const badges: { label: string; color: string }[] = [];

  badges.push({
    label: data.apiAvailable ? "REST API Open" : "Fallback Mode",
    color: data.apiAvailable ? "green" : "yellow",
  });

  // Page builder badge
  const builder = data.contentTypes.find((ct) => ct.complexity?.builder);
  if (builder?.complexity?.builder) {
    badges.push({ label: builder.complexity.builder, color: "red" });
  }

  // Multilingual badge
  if (data.urlStructure?.multilingual) {
    const ml = data.urlStructure.multilingual;
    const pluginName = data.detectedPlugins?.plugins.find(
      (p) => p.category === "multilingual"
    )?.name;
    const label = pluginName
      ? `${pluginName} · ${ml.languages.length} Languages`
      : `${ml.languages.length} Languages`;
    badges.push({ label, color: "purple" });
  }

  // SEO plugin badge
  const seo = data.detectedPlugins?.plugins.find((p) => p.category === "seo");
  if (seo) {
    badges.push({ label: seo.name, color: "blue" });
  }

  // Plugin count badge
  if (data.detectedPlugins && data.detectedPlugins.totalDetected > 5) {
    badges.push({
      label: `${data.detectedPlugins.totalDetected} Plugins`,
      color: "yellow",
    });
  }

  return badges;
}

const BADGE_COLORS: Record<string, string> = {
  green: "bg-[var(--report-green-dim)] text-[var(--report-green)]",
  red: "bg-[var(--report-red-dim)] text-[var(--report-red)]",
  blue: "bg-[var(--report-blue-dim)] text-[var(--report-blue)]",
  yellow: "bg-[var(--report-yellow-dim)] text-[var(--report-yellow)]",
  purple: "bg-[var(--report-purple-dim)] text-[var(--report-purple)]",
  orange: "bg-[var(--report-orange-dim)] text-[var(--report-orange)]",
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
    <header className="pt-10 pb-0 border-b border-[var(--border)]">
      <div className="flex items-center justify-between mb-8">
        <a href="/" className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.08em] uppercase text-[var(--report-text-secondary)] no-underline hover:text-[var(--report-text)] transition-colors">
          <div className="w-6 h-6 bg-[var(--report-accent)] rounded-[5px] flex items-center justify-center text-[12px] font-bold text-white">
            P
          </div>
          WordPress Migration Scanner
        </a>
        <div className="text-[12px] text-[var(--report-text-muted)] font-mono">
          Scanned {dateStr} · {timeStr}
        </div>
      </div>
      <div className="text-[28px] font-bold text-[var(--report-text)] mb-1.5 tracking-[-0.02em]">
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit no-underline hover:text-[var(--report-accent)] transition-colors"
        >
          {displayUrl}
        </a>
      </div>
      <div className="flex gap-2 flex-wrap mb-7">
        {badges.map((badge, i) => (
          <span
            key={i}
            className={`text-[12px] font-medium px-2.5 py-1 rounded-full font-mono ${BADGE_COLORS[badge.color] ?? ""}`}
          >
            {badge.label}
          </span>
        ))}
      </div>
    </header>
  );
}
