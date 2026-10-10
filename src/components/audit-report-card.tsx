"use client";

import type { ReactNode } from "react";
import type { AuditAnalysis } from "@/lib/server-audit";

function SectionHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
        {title}
      </h3>
      {meta && <span className="text-[12px] text-[var(--report-text-muted)] font-mono">{meta}</span>}
    </div>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] ${className}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="py-3.5 px-4">
      <div className="text-[20px] font-semibold font-mono" style={{ color: tone ?? "var(--report-text)" }}>
        {value}
      </div>
      <div className="text-[12px] text-[var(--report-text-muted)]">{label}</div>
    </div>
  );
}

const n = (v: number) => v.toLocaleString();

export function AuditReportCard({ analysis: a }: { analysis: AuditAnalysis }) {
  const env = a.environment;
  const activePlugins = a.plugins.filter((p) => p.active);
  const inactivePlugins = a.plugins.filter((p) => !p.active);

  return (
    <section className="py-10 border-b border-[var(--border)] flex flex-col gap-8" aria-labelledby="audit-heading">
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h2 id="audit-heading" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
            Server-side Audit
          </h2>
          <span className="text-[12px] text-[var(--report-text-muted)] font-mono">from database</span>
        </div>
        <p className="text-[14px] text-[var(--report-text-secondary)] max-w-[680px]">
          Exact numbers read inside WordPress. Where the public scan estimated, these values take precedence.
        </p>
      </div>

      {/* Environment */}
      <div>
        <SectionHeader title="Environment" />
        <Panel className="grid grid-cols-4 max-sm:grid-cols-2 divide-x divide-[var(--border)] max-sm:divide-x-0">
          <Stat label="WordPress" value={env.wordpress ?? "—"} />
          <Stat
            label={env.phpOutdated ? "PHP (end-of-life)" : "PHP"}
            value={env.php ?? "—"}
            tone={env.phpOutdated ? "var(--report-red)" : undefined}
          />
          <Stat label="Database size" value={env.dbMegabytes != null ? `${n(env.dbMegabytes)} MB` : "—"} />
          <Stat label="Authors" value={n(a.carry.authors)} />
        </Panel>
        <p className="mt-2 text-[12px] text-[var(--report-text-muted)] font-mono">
          Theme: {env.theme ?? "—"} · Permalinks: {env.permalink ?? "—"} · Locale: {env.language ?? "—"}
          {env.multisite ? " · Multisite" : ""}
        </p>
      </div>

      {/* Content inventory */}
      <div>
        <SectionHeader
          title="Content inventory"
          meta={`${n(a.totals.migratable)} migratable items`}
        />
        <Panel className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-[var(--report-text-muted)] border-b border-[var(--border)]">
                <th scope="col" className="py-2.5 px-4 font-semibold">Content type</th>
                <th scope="col" className="py-2.5 px-4 font-semibold text-right">Published</th>
                <th scope="col" className="py-2.5 px-4 font-semibold text-right">Drafts / private</th>
                <th scope="col" className="py-2.5 px-4 font-semibold text-right">Public scan</th>
                <th scope="col" className="py-2.5 px-4 font-semibold max-sm:hidden">URL pattern</th>
              </tr>
            </thead>
            <tbody>
              {a.content.map((r) => (
                <tr key={r.postType} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2.5 px-4 text-[var(--report-text)]">
                    {r.label}
                    <span className="ml-2 text-[11px] font-mono text-[var(--report-text-muted)]">{r.postType}</span>
                    {!r.isPublic && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--report-purple)]">hidden</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-[var(--report-text)]">{n(r.published)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[var(--report-text-secondary)]">
                    {r.unpublished ? n(r.unpublished) : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-[var(--report-text-muted)]">
                    {r.scanCount != null ? n(r.scanCount) : "not visible"}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[12px] text-[var(--report-text-muted)] max-sm:hidden">
                    {r.urlPattern ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Content model */}
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Panel className="py-4 px-5">
          <SectionHeader title="Custom blocks to rebuild" meta={`${a.customBlocks.length} types`} />
          {a.customBlocks.length === 0 ? (
            <p className="text-[13px] text-[var(--report-text-secondary)]">Only core blocks used.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {a.customBlocks.map((b) => (
                <li key={b.name} className="flex justify-between gap-3 text-[13px]">
                  <span className="font-mono text-[var(--report-text-secondary)] truncate">{b.name}</span>
                  <span className="font-mono text-[var(--report-text-muted)] shrink-0">
                    {n(b.items)} items
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[12px] text-[var(--report-text-muted)]">
            {a.coreBlockCount} core block types · {a.reusableRefs} reusable block refs
          </p>
        </Panel>

        <Panel className="py-4 px-5 flex flex-col gap-4">
          <div>
            <SectionHeader title="Fields & metadata" />
            <ul className="flex flex-col gap-1.5 text-[13px] text-[var(--report-text-secondary)]">
              <li className="flex justify-between">
                <span>ACF field paths</span>
                <span className="font-mono">{a.fields.acfDetected ? n(a.fields.fieldPaths) : "no ACF"}</span>
              </li>
              <li className="flex justify-between">
                <span>Content meta keys</span>
                <span className="font-mono">{n(a.fields.contentKeys)}</span>
              </li>
              {a.seoMeta.map((m) => (
                <li key={m.label} className="flex justify-between">
                  <span>{m.label}</span>
                  <span className="font-mono">{n(m.items)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader title="Editor" />
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--report-text-secondary)]">
              {Object.entries(a.builders).map(([k, v]) => (
                <li key={k}>
                  <span className="capitalize">{k}</span> <span className="font-mono text-[var(--report-text-muted)]">{n(v)}</span>
                </li>
              ))}
            </ul>
            {a.credibleShortcodes.length > 0 && (
              <p className="mt-2 text-[12px] text-[var(--report-text-muted)]">
                Shortcodes: {a.credibleShortcodes.map((s) => `[${s.tag}]`).join(", ")}
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* Carry-over */}
      <div>
        <SectionHeader title="Carry-over data" />
        <Panel className="grid grid-cols-4 max-sm:grid-cols-2 divide-x divide-[var(--border)] max-sm:divide-x-0">
          <Stat label="Media files" value={n(a.carry.media)} />
          <Stat label="Redirect rules" value={n(a.carry.redirects)} tone={a.carry.redirects ? "var(--report-orange)" : undefined} />
          <Stat
            label={`Comments (${n(a.carry.approvedComments)} approved)`}
            value={n(a.carry.comments)}
          />
          <Stat label={`Menu items in ${a.carry.menus} menu${a.carry.menus === 1 ? "" : "s"}`} value={n(a.carry.menuItems)} />
        </Panel>
        <p className="mt-2 text-[12px] text-[var(--report-text-muted)]">
          {n(a.carry.revisions)} revisions (safe to drop) · {a.carry.slugCollisions} slug collisions · {a.carry.orphans} orphaned pages
          {a.taxonomies.length > 0 &&
            ` · Taxonomies: ${a.taxonomies.map((t) => `${t.name} (${t.terms})`).join(", ")}`}
        </p>
      </div>

      {/* Plugins */}
      {a.plugins.length > 0 && (
        <div>
          <SectionHeader
            title="Installed plugins"
            meta={`${activePlugins.length} active · ${inactivePlugins.length} inactive`}
          />
          <Panel className="py-4 px-5">
            <ul className="grid grid-cols-2 max-sm:grid-cols-1 gap-x-6 gap-y-1.5">
              {activePlugins.map((p) => (
                <li key={p.name} className="flex items-center gap-2 text-[13px] text-[var(--report-text-secondary)] min-w-0">
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: p.seenByScan ? "var(--report-green)" : "var(--report-orange)" }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{p.name}</span>
                  {!p.seenByScan && <span className="sr-only">(not detected by public scan)</span>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-[var(--report-text-muted)]">
              <span className="text-[var(--report-green)]">●</span> also detected by public scan ·{" "}
              <span className="text-[var(--report-orange)]">●</span> only visible in audit
              {inactivePlugins.length > 0 && ` · Inactive: ${inactivePlugins.map((p) => p.name).join(", ")}`}
            </p>
          </Panel>
        </div>
      )}
    </section>
  );
}
