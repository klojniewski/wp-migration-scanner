"use client";

import type { ScanResult } from "@/types";

interface StatsRowProps {
  data: ScanResult;
}

export function StatsRow({ data }: StatsRowProps) {
  const totalItems = data.contentTypes.reduce((sum, ct) => sum + ct.count, 0);
  const langCount = data.urlStructure?.multilingual?.languages.length ?? 0;
  const indexedUrls = data.urlStructure?.totalIndexedUrls ?? 0;

  const stats = [
    { value: data.contentTypes.length, label: "Content Types" },
    { value: totalItems.toLocaleString(), label: "Total Items" },
    { value: langCount > 0 ? langCount : "—", label: "Languages" },
    { value: indexedUrls > 0 ? indexedUrls.toLocaleString() : "—", label: "Indexed URLs" },
  ];

  return (
    <div className="grid grid-cols-4 gap-px bg-[var(--border)] rounded-[var(--radius)] overflow-hidden my-8 max-sm:grid-cols-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[var(--report-surface)] py-5 px-6 text-center"
        >
          <div className="text-[32px] font-bold tracking-[-0.03em] text-[var(--report-text)] max-sm:text-[24px]">
            {stat.value}
          </div>
          <div className="text-[12px] text-[var(--report-text-muted)] uppercase tracking-[0.06em] mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
