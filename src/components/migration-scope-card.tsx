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
    <section className="py-10 border-b-0">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Migration Scope Summary
        </span>
      </div>
      <div className="bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] p-7 px-8">
        <div className="text-[17px] font-semibold text-[var(--report-text)] mb-4 leading-relaxed">
          {scope.headline}
        </div>
        <ul className="flex flex-col gap-3 list-none">
          {scope.considerations.map((item, i) => {
            const colors = COLOR_MAP[item.color] ?? COLOR_MAP.blue;
            return (
              <li key={i} className="flex gap-3 items-start text-[14px] text-[var(--report-text-secondary)] leading-relaxed">
                <div
                  className="shrink-0 w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[11px] mt-px"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {item.icon}
                </div>
                <div>
                  <strong className="text-[var(--report-text)] font-semibold">
                    {item.title}
                  </strong>
                  {" — "}
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
