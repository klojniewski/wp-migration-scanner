"use client";

export function ScanLimitations() {
  return (
    <section className="py-10 pb-6 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Scan Limitations
        </span>
      </div>
      <div className="text-[14px] text-[var(--report-text-secondary)] max-w-[680px] leading-relaxed space-y-3">
        <p>
          This report uses publicly accessible data only — no server access or credentials needed.
        </p>
        <div>
          <p className="text-[var(--report-text)] font-semibold mb-1.5">Not detected in this scan</p>
          <ul className="list-none space-y-1 text-[13px]">
            <li className="flex items-start gap-2"><span className="text-[var(--report-text-muted)] mt-px">·</span>ACF field group structures and custom field data types</li>
            <li className="flex items-start gap-2"><span className="text-[var(--report-text-muted)] mt-px">·</span>Backend-only plugins — caching, security, backups</li>
            <li className="flex items-start gap-2"><span className="text-[var(--report-text-muted)] mt-px">·</span>Database size, media library volume, and user roles</li>
            <li className="flex items-start gap-2"><span className="text-[var(--report-text-muted)] mt-px">·</span>Editorial workflows and custom permissions</li>
          </ul>
        </div>
        <p className="text-[13px]">
          Third-party integrations are detected from homepage HTML only. Inner pages may load additional services, and GTM containers may inject scripts dynamically.
        </p>
        <p className="text-[13px]">
          A full audit with <span className="text-[var(--report-text)]">wp-admin</span> access provides the complete picture for accurate scoping.
        </p>
      </div>
    </section>
  );
}
