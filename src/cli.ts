import { scan } from "./scanner";
import type { ContentType, PluginCategory, ScanResult } from "./types";

function padDots(label: string, count: string, width = 40): string {
  const dots = ".".repeat(Math.max(2, width - label.length - count.length));
  return `${label} ${dots} ${count}`;
}

function formatReport(result: ScanResult): string {
  const lines: string[] = [];

  if (result.apiAvailable) {
    lines.push("✓ WordPress REST API available\n");
  } else {
    lines.push("✗ REST API not available — using sitemap/RSS fallback\n");
  }

  lines.push("Content Structure Map");
  lines.push("═".repeat(45));
  lines.push("");

  let totalItems = 0;
  const allTaxonomySlugs = new Set<string>();

  for (const ct of result.contentTypes) {
    const countStr = ct.isEstimate ? `~${ct.count} items (estimated)` : `${ct.count} items`;
    lines.push(padDots(ct.name, countStr));

    if (ct.taxonomies.length > 0) {
      const taxParts = ct.taxonomies.map((t) => {
        allTaxonomySlugs.add(t.slug);
        return `${t.name} (${t.count})`;
      });
      lines.push(`  → ${taxParts.join(" | ")}`);
    }

    if (ct.samples.length > 0) {
      const sampleList = ct.samples
        .map((s) => `"${s}"`)
        .join(", ");
      lines.push(`  Samples: ${sampleList}`);
    }

    lines.push("");
    totalItems += ct.count;
  }

  lines.push("─".repeat(45));
  const typeCount = result.contentTypes.length;
  const taxCount = allTaxonomySlugs.size;
  lines.push(
    `${typeCount} content ${typeCount === 1 ? "type" : "types"} | ${taxCount} ${taxCount === 1 ? "taxonomy" : "taxonomies"} | ${totalItems} total items`
  );

  // URL Structure section
  if (result.urlStructure) {
    const us = result.urlStructure;
    lines.push("");
    lines.push("URL Structure");
    lines.push("═".repeat(45));
    lines.push("");
    lines.push(`Total indexed URLs: ${us.totalIndexedUrls}`);
    lines.push("");

    if (us.patterns.length > 0) {
      lines.push("Patterns:");
      for (const p of us.patterns) {
        lines.push(`  ${padDots(p.pattern, `${p.count} URLs`)}`);
        lines.push(`    e.g. ${p.example}`);
      }
    }

    if (us.multilingual) {
      lines.push("");
      lines.push(`Multilingual: ${us.multilingual.type} (${us.multilingual.languages.join(", ")})`);
    }

    lines.push("");
    lines.push("─".repeat(45));
  }

  // Detected Plugins section
  if (result.detectedPlugins && result.detectedPlugins.plugins.length > 0) {
    lines.push("");
    lines.push("Detected Plugins");
    lines.push("═".repeat(45));
    lines.push("");

    const categoryLabels: Record<PluginCategory, string> = {
      "page-builder": "Page Builders ★",
      seo: "SEO",
      forms: "Forms",
      ecommerce: "E-Commerce",
      multilingual: "Multilingual",
      cache: "Cache / Performance",
      analytics: "Analytics",
      security: "Security",
      other: "Other",
    };

    // Group plugins by category
    const groups = new Map<PluginCategory, string[]>();
    for (const p of result.detectedPlugins.plugins) {
      const list = groups.get(p.category) || [];
      list.push(p.name);
      groups.set(p.category, list);
    }

    for (const [cat, names] of groups) {
      lines.push(`  ${categoryLabels[cat]}: ${names.join(", ")}`);
    }

    lines.push("");
    lines.push("─".repeat(45));
    lines.push(`${result.detectedPlugins.totalDetected} plugins detected`);
  }

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const err of result.errors) {
      lines.push(`  ⚠ ${err}`);
    }
  }

  return lines.join("\n");
}

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error("Usage: npx tsx src/cli.ts <wordpress-site-url>");
    console.error("Example: npx tsx src/cli.ts https://example.com");
    process.exit(1);
  }

  console.log(`\nScanning ${url} ...\n`);

  try {
    const result = await scan(url);
    console.log(formatReport(result));
  } catch (err) {
    console.error("Scan failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
