import type { ScanResult, MigrationScope, MigrationConsideration } from "@/types";

function getSizeLabel(totalItems: number): string {
  if (totalItems < 100) return "Small";
  if (totalItems < 500) return "Medium";
  if (totalItems < 2000) return "Large";
  return "Large";
}

export function generateMigrationScope(data: ScanResult): MigrationScope {
  const totalItems = data.contentTypes.reduce((sum, ct) => sum + ct.count, 0);
  const typeCount = data.contentTypes.length;
  const isMultilingual = data.urlStructure?.multilingual != null;
  const langCount = data.urlStructure?.multilingual?.languages.length ?? 0;
  const taxonomyCount = data.contentTypes.reduce(
    (sum, ct) => sum + ct.taxonomies.length,
    0
  );

  // Build headline
  const sizeLabel = getSizeLabel(totalItems);
  const multiPart = isMultilingual ? ", multilingual" : "";
  const complexPart = taxonomyCount > 10 ? " with significant structural complexity" : "";
  const headline = `${sizeLabel}${multiPart} content platform${complexPart}. ${typeCount} content types spanning ${totalItems.toLocaleString()} items${isMultilingual ? ` across ${langCount} languages` : ""}, organized through ${taxonomyCount}+ taxonomy systems${taxonomyCount > 5 ? " with cross-type relationships" : ""}.`;

  const considerations: MigrationConsideration[] = [];

  // Page builder dependency
  const builder = data.contentTypes.find((ct) => ct.complexity?.builder != null);
  if (builder) {
    const builderName = builder.complexity!.builder!;
    const complexPages = data.contentTypes.filter(
      (ct) => ct.complexity?.level === "complex"
    );
    const pageCount = complexPages.reduce((sum, ct) => sum + ct.count, 0);
    considerations.push({
      icon: "⚠",
      color: "red",
      title: "Page builder dependency",
      body: `${builderName} detected. Pages likely mix layout with content and will need content extraction, not 1:1 copy. Expect higher effort on the ${pageCount} pages vs standard post types.`,
    });
  }

  // Multilingual with uneven coverage
  if (isMultilingual && langCount > 1) {
    const langPrefixes = data.urlStructure!.multilingual!.languages.filter(
      (l) => l !== "en"
    );
    const prefixStr = langPrefixes.join(", ");
    considerations.push({
      icon: "⟠",
      color: "purple",
      title: "Multilingual with uneven coverage",
      body: `${langPrefixes.length} language subdirectories (${prefixStr}) but content depth varies significantly. Some content areas appear English-only. Translation workflow will require redesign.`,
    });
  }

  // High media/video count
  const videoTypes = data.contentTypes.filter(
    (ct) =>
      ct.name.toLowerCase().includes("video") ||
      ct.slug.toLowerCase().includes("video")
  );
  const mediaCount = videoTypes.reduce((sum, ct) => sum + ct.count, 0);
  if (mediaCount > 50) {
    considerations.push({
      icon: "▶",
      color: "orange",
      title: "Media-heavy content",
      body: `${mediaCount} video entries detected. Clarify whether these are embedded (YouTube/Vimeo) or self-hosted before scoping media migration.`,
    });
  }

  // Complex taxonomy relationships
  const complexTaxTypes = data.contentTypes.filter(
    (ct) => ct.taxonomies.length >= 5
  );
  if (complexTaxTypes.length > 0) {
    const most = complexTaxTypes.sort(
      (a, b) => b.taxonomies.length - a.taxonomies.length
    )[0];
    const taxNames = most.taxonomies.map((t) => t.name).join(", ");
    considerations.push({
      icon: "◈",
      color: "yellow",
      title: "Complex taxonomy relationships",
      body: `${most.name} reference${most.name.endsWith("s") ? "" : "s"} ${most.taxonomies.length} taxonomy dimensions (${taxNames}). This cross-referencing needs careful schema modeling.`,
    });
  }

  // Dead weight identified (404 errors)
  const http404 = data.errors.filter((e) => e.includes("404"));
  if (http404.length > 0) {
    considerations.push({
      icon: "✓",
      color: "green",
      title: "Dead weight identified",
      body: `${http404.length} plugin content type${http404.length !== 1 ? "s" : ""} returned 404. Likely safe to exclude from migration scope.`,
    });
  }

  // Scale note for large content
  if (totalItems > 1000) {
    considerations.push({
      icon: "◉",
      color: "blue",
      title: "Scale considerations",
      body: `${totalItems.toLocaleString()} total items across ${typeCount} content types. Batch migration scripts and progress tracking will be important for a project of this scale.`,
    });
  }

  return { headline, considerations };
}
