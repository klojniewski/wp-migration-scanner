"use client";

import { AlertTriangle } from "lucide-react";

interface ScanWarningsProps {
  errors: string[];
}

export function ScanWarnings({ errors }: ScanWarningsProps) {
  if (errors.length === 0) return null;

  return (
    <section className="py-8 border-b border-border">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Scan Warnings
      </h2>
      <div className="flex flex-col gap-2">
        {errors.map((err, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 py-2.5 px-4 border border-border rounded-md text-sm text-muted-foreground font-mono bg-card"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--report-yellow)] shrink-0" />
            {err}
          </div>
        ))}
      </div>
    </section>
  );
}
