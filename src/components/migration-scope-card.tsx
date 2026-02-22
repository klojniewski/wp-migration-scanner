"use client";

import type { MigrationScope } from "@/types";

interface MigrationScopeCardProps {
  scope: MigrationScope;
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  red: { bg: "var(--report-red-dim)", text: "var(--report-red)" },
  purple: { bg: "var(--report-purple-dim)", text: "var(--report-purple)" },
  orange: { bg: "var(--report-orange-dim)", text: "var(--report-orange)" },
  yellow: { bg: "var(--report-yellow-dim)", text: "var(--report-yellow)" },
  green: { bg: "var(--report-green-dim)", text: "var(--report-green)" },
  blue: { bg: "var(--report-blue-dim)", text: "var(--report-blue)" },
};

export function MigrationScopeCard({ scope }: MigrationScopeCardProps) {
  return (
    <section className="pb-8">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Migration Scope
      </h2>
      <div className="border border-border rounded-lg p-6 bg-card">
        <p className="text-base font-medium text-foreground mb-5 leading-relaxed">
          {scope.headline}
        </p>
        <ul className="flex flex-col gap-3">
          {scope.considerations.map((item, i) => {
            const colors = COLOR_MAP[item.color] ?? COLOR_MAP.blue;
            return (
              <li
                key={i}
                className="flex gap-3 items-start text-sm text-muted-foreground leading-relaxed"
              >
                <div
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs mt-px"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {item.icon}
                </div>
                <div>
                  <span className="text-foreground font-medium">
                    {item.title}
                  </span>
                  {" - "}
                  {item.body}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
