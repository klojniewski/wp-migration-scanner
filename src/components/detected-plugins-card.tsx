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
  other: "var(--muted-foreground)",
};

interface DetectedPluginsCardProps {
  pluginScanResult: PluginScanResult;
}

export function DetectedPluginsCard({
  pluginScanResult,
}: DetectedPluginsCardProps) {
  const { plugins, totalDetected } = pluginScanResult;

  const groups = new Map<PluginCategory, typeof plugins>();
  for (const p of plugins) {
    const list = groups.get(p.category) || [];
    list.push(p);
    groups.set(p.category, list);
  }

  const otherPlugins = groups.get("other") || [];
  const mainGroups = Array.from(groups.entries()).filter(
    ([cat]) => cat !== "other"
  );

  return (
    <section className="py-8 border-b border-border">
      <div className="flex items-baseline justify-between mb-1.5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Detected Plugins
        </h2>
        <span className="text-xs text-muted-foreground font-mono">
          {totalDetected} plugins from HTML source
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        Plugins identified from script paths, CSS classes, and HTML comments.
        Only plugins with frontend output are detectable - actual count is likely
        higher.
      </p>

      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {mainGroups.map(([category, categoryPlugins]) => (
          <div
            key={category}
            className="border border-border rounded-lg py-4 px-5 bg-card"
          >
            <div
              className="text-xs font-medium uppercase tracking-wide mb-3"
              style={{ color: CATEGORY_COLORS[category] }}
            >
              {CATEGORY_LABELS[category]}
            </div>
            <ul className="flex flex-col gap-2">
              {categoryPlugins.map((p) => (
                <li
                  key={p.slug}
                  className="text-sm text-muted-foreground flex items-center gap-2"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[category] }}
                  />
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {otherPlugins.length > 0 && (
          <div className="col-span-full border border-border rounded-lg py-4 px-5 bg-card">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Other ({otherPlugins.length})
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {otherPlugins.map((p) => (
                <li
                  key={p.slug}
                  className="text-sm text-muted-foreground flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground" />
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
