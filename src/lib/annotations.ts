import type { ScanResult, Annotation } from "@/types";

type AnnotationRule = (data: ScanResult) => Annotation | null;

/** Rule 1: Page builder detected + complex pages → content extraction warning */
function builderContentExtraction(data: ScanResult): Annotation | null {
  const builder = data.contentTypes.find(
    (ct) => ct.complexity?.builder != null
  );
  if (!builder) return null;

  const complexPages = data.contentTypes.filter(
    (ct) => ct.complexity?.level === "complex"
  );
  if (complexPages.length === 0) return null;

  const builderName = builder.complexity!.builder!;
  const names = complexPages.map((ct) => `${ct.name} (${ct.count})`).join(", ");

  return {
    title: `${names} flagged as Complex`,
    body: `${builderName} detected. These pages store layout structure mixed with content. Migration requires content extraction and rebuild as modular sections, not 1:1 copy.`,
    severity: "warning",
    section: "content-types",
  };
}

/** Rule 2: Any type with 5+ taxonomies → schema modeling note */
function complexTaxonomySchema(data: ScanResult): Annotation | null {
  const complex = data.contentTypes.filter((ct) => ct.taxonomies.length >= 5);
  if (complex.length === 0) return null;

  const most = complex.sort((a, b) => b.taxonomies.length - a.taxonomies.length)[0];

  return {
    title: `${most.name} use${most.name.endsWith("s") ? "" : "s"} ${most.taxonomies.length} taxonomy dimensions`,
    body: `This is the most relationship-heavy content type. The target schema needs careful reference modeling to preserve all filtering capabilities.`,
    severity: "warning",
    section: "content-types",
  };
}

/** Rule 3: "test" in sample titles → work-in-progress flag */
function testContentWarning(data: ScanResult): Annotation | null {
  const withTest = data.contentTypes.filter((ct) =>
    ct.samples.some((s) => /\btest\b/i.test(s.title))
  );
  if (withTest.length === 0) return null;

  const names = withTest.map((ct) => `"${ct.name}"`).join(", ");

  return {
    title: `${names} with test posts detected`,
    body: `Appears to be a work-in-progress replacement. Clarify with team which version to migrate.`,
    severity: "info",
    section: "content-types",
  };
}

/** Rule 4: Some content areas English-only → translation gap note */
function multilingualGaps(data: ScanResult): Annotation | null {
  if (!data.urlStructure?.multilingual) return null;
  if (data.urlStructure.multilingual.languages.length < 2) return null;

  const langPrefixes = data.urlStructure.multilingual.languages.filter(
    (l) => l !== "en"
  );
  const patterns = data.urlStructure.patterns;

  // Find patterns that only appear in English (no lang-prefix variants)
  const englishOnly = patterns.filter((p) => {
    const isLangVariant = langPrefixes.some(
      (lang) => p.pattern.startsWith(`/${lang}/`)
    );
    return !isLangVariant && p.count > 20;
  });

  if (englishOnly.length < 2) return null;

  return {
    title: "Significant translation gaps",
    body: `Several content areas exist only in English. Decide during planning: migrate English-only and add translations later, or scope translation as part of the project?`,
    severity: "warning",
    section: "multilingual",
  };
}

/** Rule 5: WPML detected → localization redesign note */
function wpmlWorkflow(data: ScanResult): Annotation | null {
  const hasWpml = data.detectedPlugins?.plugins.some(
    (p) => p.slug === "wpml" || p.name.toLowerCase().includes("wpml")
  );
  if (!hasWpml) return null;

  return {
    title: "WPML → localization redesign",
    body: `The target CMS uses document-level or field-level localization instead of WPML's URL-based approach. Your translation workflows and editorial process will need to be redesigned. This is typically an improvement but requires planning.`,
    severity: "warning",
    section: "multilingual",
  };
}

/** Rule 6: JetEngine/JetMenu/JetSearch detected → custom rebuild note */
function crocoblockRebuild(data: ScanResult): Annotation | null {
  if (!data.detectedPlugins) return null;

  const jetPlugins = data.detectedPlugins.plugins.filter((p) =>
    /^jet(engine|menu|search)/i.test(p.slug) ||
    /^jet(engine|menu|search)/i.test(p.name.replace(/\s+/g, ""))
  );
  if (jetPlugins.length === 0) return null;

  const names = jetPlugins.map((p) => p.name).join(" + ");

  return {
    title: `${names} detected`,
    body: `These Crocoblock plugins handle custom post type queries, mega menus, and search. Their functionality will need to be rebuilt as custom frontend components and CMS queries.`,
    severity: "warning",
    section: "plugins",
  };
}

/** Rule 7: 20+ plugins → backend-only plugins note */
function highPluginCount(data: ScanResult): Annotation | null {
  if (!data.detectedPlugins) return null;
  if (data.detectedPlugins.totalDetected < 20) return null;

  const count = data.detectedPlugins.totalDetected;

  return {
    title: `${count} detected, likely ${count + 10}+ actual`,
    body: `Backend-only plugins (caching, security, backups, ACF) aren't visible from public scan. Request wp-admin access or plugin export for complete picture.`,
    severity: "warning",
    section: "plugins",
  };
}

/** Rule 8: 404 warnings present → safe-to-exclude note */
function deadContent(data: ScanResult): Annotation | null {
  const http404 = data.errors.filter((e) => e.includes("404"));
  if (http404.length === 0) return null;

  return {
    title: "Dead content types detected",
    body: `These content types are registered in WordPress but return 404 — likely from deactivated or partially removed plugins. Safe to exclude from migration scope.`,
    severity: "info",
    section: "warnings",
  };
}

/** Rule 9: URL count > 100 → redirect mapping note */
function redirectMapping(data: ScanResult): Annotation | null {
  if (!data.urlStructure) return null;
  if (data.urlStructure.totalIndexedUrls <= 100) return null;

  const count = data.urlStructure.totalIndexedUrls;
  const patternCount = data.urlStructure.patterns.length;

  return {
    title: `${count.toLocaleString()} URLs need redirect mapping`,
    body: `All ${patternCount} URL patterns require 301 redirect rules. ${data.urlStructure.multilingual ? "Language subdirectories add complexity: decide if new URL structure keeps language prefixes or switches to a different pattern. " : ""}This decision must be made before migration starts.`,
    severity: "warning",
    section: "url-structure",
  };
}

/** Rule 10: Root-level /{page}/ pattern is largest → review content assignment */
function flatStructureReview(data: ScanResult): Annotation | null {
  if (!data.urlStructure) return null;
  const patterns = data.urlStructure.patterns;
  if (patterns.length === 0) return null;

  const sorted = [...patterns].sort((a, b) => b.count - a.count);
  const largest = sorted[0];

  if (!largest.pattern.match(/^\/{[^/]+}\/$/)) return null;
  if (sorted.length > 1 && largest.count <= sorted[1].count) return null;

  return {
    title: `${largest.count} root-level pages`,
    body: `The ${largest.pattern} pattern is the largest group but likely includes both real pages and flattened custom post type slugs. Review this list for proper content type assignment during modeling.`,
    severity: "info",
    section: "url-structure",
  };
}

/** Rule 11: GTM detected → dynamic loading warning */
function gtmDynamicLoading(data: ScanResult): Annotation | null {
  const hasGtm = data.detectedIntegrations?.integrations.some(
    (i) => i.slug === "google-tag-manager"
  );
  if (!hasGtm) return null;

  return {
    title: "Google Tag Manager detected",
    body: `Additional analytics and tracking services may be loaded dynamically via GTM and are not visible in static HTML analysis. Request GTM container export for complete integration inventory.`,
    severity: "info",
    section: "integrations",
  };
}

/** Rule 12: 5+ integrations → migration complexity note */
function highIntegrationCount(data: ScanResult): Annotation | null {
  if (!data.detectedIntegrations) return null;
  if (data.detectedIntegrations.totalDetected < 5) return null;

  const count = data.detectedIntegrations.totalDetected;

  return {
    title: `${count} third-party integrations detected`,
    body: `Each integration requires equivalent implementation or replacement in the target platform. Plan integration setup as a distinct migration workstream.`,
    severity: "warning",
    section: "integrations",
  };
}

/** Rule 13: Multiple analytics tools → consolidation opportunity */
function multipleAnalytics(data: ScanResult): Annotation | null {
  if (!data.detectedIntegrations) return null;

  const analyticsTools = data.detectedIntegrations.integrations.filter(
    (i) => i.category === "analytics"
  );
  if (analyticsTools.length < 2) return null;

  const names = analyticsTools.map((i) => i.name).join(", ");

  return {
    title: "Multiple analytics tools detected",
    body: `${names} — consider consolidation during migration to reduce page weight and simplify tracking.`,
    severity: "info",
    section: "integrations",
  };
}

/** Rule 14: Cookie consent detected → compliance note */
function cookieConsentCompliance(data: ScanResult): Annotation | null {
  if (!data.detectedIntegrations) return null;

  const consentTool = data.detectedIntegrations.integrations.find(
    (i) => i.category === "cookie-consent"
  );
  if (!consentTool) return null;

  return {
    title: `${consentTool.name} cookie consent detected`,
    body: `GDPR/CCPA compliance configuration will need reimplementation. Export current consent categories and banner settings before migration.`,
    severity: "warning",
    section: "integrations",
  };
}

const rules: AnnotationRule[] = [
  builderContentExtraction,
  complexTaxonomySchema,
  testContentWarning,
  multilingualGaps,
  wpmlWorkflow,
  crocoblockRebuild,
  highPluginCount,
  deadContent,
  redirectMapping,
  flatStructureReview,
  gtmDynamicLoading,
  highIntegrationCount,
  multipleAnalytics,
  cookieConsentCompliance,
];

export function generateAnnotations(data: ScanResult): Annotation[] {
  return rules
    .map((rule) => rule(data))
    .filter((a): a is Annotation => a !== null);
}
