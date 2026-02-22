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

function buildMatrix(
  data: ScanResult
): { languages: string[]; rows: LanguageRow[] } {
  const ml = data.urlStructure?.multilingual;
  if (!ml) return { languages: [], rows: [] };

  const languages = ml.languages;
  const patterns = data.urlStructure!.patterns;
  const nonEnLangs = languages.filter((l) => l !== "en");

  const areaMap = new Map<string, Map<string, number>>();

  for (const p of patterns) {
    const langMatch = nonEnLangs.find(
      (lang) =>
        p.pattern.startsWith(`/${lang}/`) || p.pattern === `/${lang}/{slug}/`
    );

    if (langMatch) {
      const basePart = p.pattern
        .replace(`/${langMatch}/`, "/")
        .replace(/\{[^}]+\}/g, "*");
      const areaName = inferAreaName(basePart, p.pattern);
      const counts = areaMap.get(areaName) ?? new Map<string, number>();
      counts.set(langMatch, (counts.get(langMatch) ?? 0) + p.count);
      areaMap.set(areaName, counts);
    } else {
      const areaName = inferAreaName(p.pattern, p.pattern);
      const counts = areaMap.get(areaName) ?? new Map<string, number>();
      counts.set("en", (counts.get("en") ?? 0) + p.count);
      areaMap.set(areaName, counts);
    }
  }

  const rows: LanguageRow[] = Array.from(areaMap.entries())
    .map(([area, counts]) => ({ area, counts }))
    .sort((a, b) => {
      const totalA = Array.from(a.counts.values()).reduce((s, c) => s + c, 0);
      const totalB = Array.from(b.counts.values()).reduce((s, c) => s + c, 0);
      return totalB - totalA;
    });

  return { languages, rows };
}

function inferAreaName(basePart: string, original: string): string {
  if (basePart === "/*/" || basePart === "/{page}/") return "Pages & Blog";
  const segments = basePart.split("/").filter(Boolean);
  if (segments.length === 0) return "Pages & Blog";

  const first = segments[0].replace(/\*/g, "").replace(/\{[^}]+\}/g, "");
  if (!first) return "Pages & Blog";

  if (original.includes("/blog/")) return "Blog (nested)";

  return first
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function MultilingualMatrix({ data }: MultilingualMatrixProps) {
  const { languages, rows } = buildMatrix(data);

  if (languages.length < 2 || rows.length === 0) return null;

  const pluginName = data.detectedPlugins?.plugins.find(
    (p) => p.category === "multilingual"
  )?.name;

  return (
    <section className="py-8 border-b border-border">
      <div className="flex items-baseline justify-between mb-1.5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Multilingual Coverage
        </h2>
        <span className="text-xs text-muted-foreground font-mono">
          {languages.length} languages
          {pluginName ? ` · ${pluginName} detected` : ""}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        Estimated content distribution per language based on URL structure
        analysis. Cells show URL count per language subdirectory.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 border border-border rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="text-left py-2.5 px-3.5 text-xs font-medium text-muted-foreground bg-secondary border-b border-border">
                Content Area
              </th>
              {languages.map((lang) => (
                <th
                  key={lang}
                  className="text-center py-2.5 px-3.5 text-xs font-medium text-muted-foreground bg-secondary border-b border-border"
                >
                  {FLAG_MAP[lang] ?? ""} {lang.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.area}
                className="hover:bg-secondary/50 transition-colors"
              >
                <td
                  className={`text-left py-2.5 px-3.5 font-medium text-sm text-foreground ${
                    i < rows.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  {row.area}
                </td>
                {languages.map((lang) => {
                  const count = row.counts.get(lang);
                  const colorClass = count
                    ? count > 100
                      ? "text-[var(--report-green)]"
                      : "text-[var(--report-yellow)]"
                    : "text-muted-foreground";
                  return (
                    <td
                      key={lang}
                      className={`text-center py-2.5 px-3.5 font-mono text-sm ${colorClass} ${
                        i < rows.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      {count ? count : "-"}
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
