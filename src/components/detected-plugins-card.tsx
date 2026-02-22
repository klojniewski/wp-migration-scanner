"use client";

import type { PluginCategory, PluginScanResult } from "@/types";

const CATEGORY_LABELS: Record<PluginCategory, string> = {
  "page-builder": "Page Builders",
  seo: "SEO",
  forms: "Forms",
  ecommerce: "E-Commerce",
  multilingual: "Multilingual",
  cache: "Cache / Performance",
  analytics: "Analytics",
  security: "Security",
  other: "Other",
};

const CATEGORY_COLORS: Record<PluginCategory, string> = {
  "page-builder": "var(--report-red)",
  seo: "var(--report-blue)",
  forms: "var(--report-green)",
  ecommerce: "var(--report-orange)",
  multilingual: "var(--report-purple)",
  cache: "var(--report-yellow)",
  analytics: "var(--report-blue)",
  security: "var(--report-yellow)",
  other: "var(--report-text-muted)",
};

interface DetectedPluginsCardProps {
  pluginScanResult: PluginScanResult;
}

export function DetectedPluginsCard({ pluginScanResult }: DetectedPluginsCardProps) {
  const { plugins, totalDetected } = pluginScanResult;

  // Group by category
  const groups = new Map<PluginCategory, typeof plugins>();
  for (const p of plugins) {
    const list = groups.get(p.category) || [];
    list.push(p);
    groups.set(p.category, list);
  }

  // Separate "other" from the rest
  const otherPlugins = groups.get("other") || [];
  const mainGroups = Array.from(groups.entries()).filter(([cat]) => cat !== "other");

  return (
    <section className="py-10 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Detected Plugins
        </span>
        <span className="text-[12px] text-[var(--report-text-muted)] font-mono">
          {totalDetected} plugins from HTML source
        </span>
      </div>
      <p className="text-[14px] text-[var(--report-text-secondary)] mb-6 max-w-[680px]">
        Plugins identified from script paths, CSS classes, and HTML comments. Only plugins with frontend output are detectable — actual count is likely higher.
      </p>

      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {mainGroups.map(([category, categoryPlugins]) => (
          <div
            key={category}
            className="bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] py-4 px-5"
          >
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5"
              style={{ color: CATEGORY_COLORS[category] }}
            >
              {category === "page-builder" ? "★ " : ""}
              {CATEGORY_LABELS[category]}
            </div>
            <ul className="list-none flex flex-col gap-1.5">
              {categoryPlugins.map((p) => (
                <li
                  key={p.slug}
                  className="text-[13px] text-[var(--report-text-secondary)] flex items-center gap-1.5"
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[category] }}
                  />
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {otherPlugins.length > 0 && (
          <div className="col-span-full bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] py-4 px-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] mb-2.5">
              Other ({otherPlugins.length})
            </div>
            <ul className="list-none flex flex-wrap gap-x-4 gap-y-1.5">
              {otherPlugins.map((p) => (
                <li
                  key={p.slug}
                  className="text-[13px] text-[var(--report-text-secondary)] flex items-center gap-1.5"
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: "var(--report-text-muted)" }}
                  />
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
