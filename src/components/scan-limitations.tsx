"use client";

import { Info } from "lucide-react";

export function ScanLimitations() {
  return (
    <section className="py-8 border-b border-border">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Scan Limitations
      </h2>
      <div className="flex gap-3 items-start">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          This report is generated from publicly accessible data only - no
          server access or credentials required.{" "}
          <span className="text-foreground font-medium">
            Not detected in this scan:
          </span>{" "}
          ACF field group structures, backend-only plugins (caching, security,
          backups), custom field data types, database size, media library volume,
          editorial workflows, and user roles. A full technical audit with
          wp-admin access provides the complete picture for accurate scoping.
        </p>
      </div>
    </section>
  );
}
