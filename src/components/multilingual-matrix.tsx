"use client";

import type { ScanResult } from "@/types";

interface MultilingualMatrixProps {
  data: ScanResult;
}

interface LanguageRow {
  area: string;
  counts: Map<string, number>;
}

const FLAG_MAP: Record<string, string> = {
  en: "\u{1F1EC}\u{1F1E7}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
  it: "\u{1F1EE}\u{1F1F9}",
  de: "\u{1F1E9}\u{1F1EA}",
  "pt-br": "\u{1F1E7}\u{1F1F7}",
  pt: "\u{1F1F5}\u{1F1F9}",
  nl: "\u{1F1F3}\u{1F1F1}",
  ja: "\u{1F1EF}\u{1F1F5}",
  zh: "\u{1F1E8}\u{1F1F3}",
  ko: "\u{1F1F0}\u{1F1F7}",
  ru: "\u{1F1F7}\u{1F1FA}",
  ar: "\u{1F1F8}\u{1F1E6}",
  pl: "\u{1F1F5}\u{1F1F1}",
};

function buildMatrix(data: ScanResult): { languages: string[]; rows: LanguageRow[] } {
  const ml = data.urlStructure?.multilingual;
  if (!ml) return { languages: [], rows: [] };

  const languages = ml.languages;
  const patterns = data.urlStructure!.patterns;
  const langSet = new Set(languages);

  // A language is "prefixed" when it appears as a URL path prefix. Any language
  // that never appears as a prefix is the site's default served at the root
  // (e.g. English at "/"), so non-prefixed patterns are attributed to it.
  const prefixed = new Set<string>();
  for (const p of patterns) {
    for (const lang of languages) {
      if (p.pattern === `/${lang}/` || p.pattern.startsWith(`/${lang}/`)) {
        prefixed.add(lang);
      }
    }
  }
  const defaultLang = languages.find((l) => !prefixed.has(l));

  // Group patterns by content area (blog, magazine, services, pages…), keyed by
  // the first content segment after the locale prefix.
  const areaMap = new Map<string, Map<string, number>>();

  for (const p of patterns) {
    // Longest matching locale prefix, so "en" can't shadow "en-us".
    const lang = languages
      .filter((l) => p.pattern === `/${l}/` || p.pattern.startsWith(`/${l}/`))
      .sort((a, b) => b.length - a.length)[0];

    const attributed = lang ?? defaultLang;
    if (!attributed) continue; // non-localized pattern with no default → skip

    const basePart = (lang ? p.pattern.replace(`/${lang}/`, "/") : p.pattern).replace(
      /\{[^}]+\}/g,
      "*"
    );
    const areaName = inferAreaName(basePart);

    const counts = areaMap.get(areaName) ?? new Map<string, number>();
    counts.set(attributed, (counts.get(attributed) ?? 0) + p.count);
    areaMap.set(areaName, counts);
  }

  const total = (counts: Map<string, number>) =>
    Array.from(counts.values()).reduce((s, c) => s + c, 0);

  const localesCovered = (counts: Map<string, number>) =>
    Array.from(counts.entries()).filter(([lang, c]) => c > 0 && langSet.has(lang)).length;

  // A segment is a genuine cross-language content type (e.g. a "/magazine/" or
  // "/blog/" section that uses the same slug in every locale) only when it
  // spans a strong majority of locales. Sites often localize section slugs
  // (rent-storage / lagerraum-mieten / opslagruimte-huren all mean the same
  // thing), so those one-off segments are folded into the top-level Pages
  // bucket instead of cluttering the matrix with single-language rows.
  const PAGES = "Pages";
  const minLocales = Math.max(2, Math.ceil(languages.length * 0.6));
  const pagesCounts = areaMap.get(PAGES) ?? new Map<string, number>();

  for (const [area, counts] of Array.from(areaMap.entries())) {
    if (area === PAGES) continue;
    if (localesCovered(counts) < minLocales) {
      for (const [lang, c] of counts) {
        pagesCounts.set(lang, (pagesCounts.get(lang) ?? 0) + c);
      }
      areaMap.delete(area);
    }
  }
  if (pagesCounts.size > 0) areaMap.set(PAGES, pagesCounts);

  const rows: LanguageRow[] = Array.from(areaMap.entries())
    .map(([area, counts]) => ({ area, counts }))
    .filter((row) => localesCovered(row.counts) > 0)
    .sort((a, b) => total(b.counts) - total(a.counts));

  return { languages, rows };
}

function inferAreaName(basePart: string): string {
  // basePart has placeholders normalized to "*", e.g. "/*/", "/magazine/*/", "/".
  // The first real segment names the content area; a bare path is top-level pages.
  const segments = basePart.split("/").filter((s) => s && s !== "*");
  if (segments.length === 0) return "Pages";

  return segments[0]
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function MultilingualMatrix({ data }: MultilingualMatrixProps) {
  const { languages, rows } = buildMatrix(data);

  if (languages.length < 2 || rows.length === 0) return null;

  const pluginName = data.detectedPlugins?.plugins.find(
    (p) => p.category === "multilingual"
  )?.name;

  return (
    <section className="py-10 border-b border-[var(--border)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--report-accent)]">
          Multilingual Coverage
        </span>
        <span className="text-[12px] text-[var(--report-text-muted)] font-mono">
          {languages.length} languages{pluginName ? ` · ${pluginName} detected` : ""}
        </span>
      </div>
      <p className="text-[14px] text-[var(--report-text-secondary)] mb-6 max-w-[680px]">
        Estimated content distribution per language based on URL structure analysis. Cells show URL count per language subdirectory.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
          <thead>
            <tr>
              <th className="text-left py-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)]">
                Content Area
              </th>
              {languages.map((lang) => (
                <th
                  key={lang}
                  className="text-center py-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--report-text-muted)] bg-[var(--report-surface-2)] border-b border-[var(--border)]"
                >
                  {FLAG_MAP[lang] ?? ""} {lang.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.area} className="hover:bg-[var(--report-surface-2)]">
                <td
                  className={`text-left py-2.5 px-3.5 font-medium text-[var(--report-text)] ${i < rows.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  {row.area}
                </td>
                {languages.map((lang) => {
                  const count = row.counts.get(lang);
                  const colorClass = count
                    ? count > 100
                      ? "text-[var(--report-green)]"
                      : "text-[var(--report-yellow)]"
                    : "text-[var(--report-text-muted)]";
                  return (
                    <td
                      key={lang}
                      className={`text-center py-2.5 px-3.5 font-mono text-[13px] ${colorClass} ${i < rows.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                    >
                      {count ? count : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
