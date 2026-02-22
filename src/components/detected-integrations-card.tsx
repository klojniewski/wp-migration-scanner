"use client";

import type { IntegrationCategory, IntegrationScanResult } from "@/types";

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  analytics: "Analytics",
  "tag-manager": "Tag Manager",
  chat: "Chat",
  heatmap: "Heatmap / A-B Testing",
  marketing: "Marketing",
  "form-embed": "Form Embed",
  scheduling: "Scheduling",
  "cookie-consent": "Cookie Consent",
  other: "Other",
};

const CATEGORY_COLORS: Record<IntegrationCategory, string> = {
  analytics: "var(--report-blue)",
  "tag-manager": "var(--report-orange)",
  chat: "var(--report-green)",
  heatmap: "var(--report-red)",
  marketing: "var(--report-purple)",
  "form-embed": "var(--report-yellow)",
  scheduling: "var(--report-blue)",
  "cookie-consent": "var(--report-orange)",
  other: "var(--report-text-muted)",
};

interface DetectedIntegrationsCardProps {
  integrationScanResult: IntegrationScanResult;
}

export function DetectedIntegrationsCard({ integrationScanResult }: DetectedIntegrationsCardProps) {
  const { integrations, totalDetected } = integrationScanResult;

  // Group by category
  const groups = new Map<IntegrationCategory, typeof integrations>();
  for (const i of integrations) {
    const list = groups.get(i.category) || [];
    list.push(i);
    groups.set(i.category, list);
  }

  // Separate "other" from the rest
  const otherIntegrations = groups.get("other") || [];
  const mainGroups = Array.from(groups.entries()).filter(([cat]) => cat !== "other");

  return (
    <section className="py-10 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Third-Party Integrations
        </span>
        <span className="text-[12px] text-[var(--report-text-muted)] font-mono">
          {totalDetected} integrations from HTML source
        </span>
      </div>
      <p className="text-[14px] text-[var(--report-text-secondary)] mb-6 max-w-[680px]">
        Third-party services detected from script tags, iframes, and inline code on the homepage.
        Each integration requires equivalent implementation or replacement in the target platform.
      </p>

      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {mainGroups.map(([category, categoryIntegrations]) => (
          <div
            key={category}
            className="bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] py-4 px-5"
          >
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5"
              style={{ color: CATEGORY_COLORS[category] }}
            >
              {CATEGORY_LABELS[category]}
            </div>
            <ul className="list-none flex flex-col gap-1.5">
              {categoryIntegrations.map((i) => (
                <li
                  key={i.slug}
                  className="text-[13px] text-[var(--report-text-secondary)] flex items-center gap-1.5"
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[category] }}
                  />
                  {i.name}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {otherIntegrations.length > 0 && (
          <div className="col-span-full bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] py-4 px-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--report-text-muted)] mb-2.5">
              Other ({otherIntegrations.length})
            </div>
            <ul className="list-none flex flex-wrap gap-x-4 gap-y-1.5">
              {otherIntegrations.map((i) => (
                <li
                  key={i.slug}
                  className="text-[13px] text-[var(--report-text-secondary)] flex items-center gap-1.5"
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: "var(--report-text-muted)" }}
                  />
                  {i.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
