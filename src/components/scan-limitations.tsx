"use client";

export function ScanLimitations() {
  return (
    <section className="py-10 pb-6 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Scan Limitations
        </span>
      </div>
      <p className="text-[14px] text-[var(--report-text-secondary)] max-w-[680px] leading-relaxed">
        This report is generated from publicly accessible data only — no server access or credentials required.{" "}
        <strong className="text-[var(--report-text)] font-semibold">Not detected in this scan:</strong>{" "}
        ACF field group structures, backend-only plugins (caching, security, backups), custom field data types, database size, media library volume, editorial workflows, and user roles.
        Third-party integrations are detected from homepage HTML only — inner pages may load additional services, and GTM containers may inject scripts dynamically.
        A full technical audit with wp-admin access provides the complete picture for accurate scoping.
      </p>
    </section>
  );
}
