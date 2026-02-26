export interface TaxonomyRef {
  name: string;
  slug: string;
  count: number;
  terms: string[];
}

export type ComplexityLevel = "simple" | "moderate" | "complex";

export interface ContentComplexity {
  level: ComplexityLevel;
  signals: string[];
  builder: string | null;
}

export interface ContentType {
  name: string;
  slug: string;
  count: number;
  isEstimate: boolean;
  samples: { title: string; url?: string }[];
  taxonomies: TaxonomyRef[];
  complexity: ContentComplexity | null;
}

export interface UrlPattern {
  pattern: string;       // e.g. "/blog/{slug}/"
  example: string;       // e.g. "/blog/my-first-post/"
  count: number;
}

export interface UrlStructure {
  totalIndexedUrls: number;
  patterns: UrlPattern[];
  multilingual: MultilingualInfo | null;
}

export interface MultilingualInfo {
  type: "subdirectory" | "subdomain" | "hreflang";
  languages: string[];   // e.g. ["en", "de", "fr"]
}

export type PluginCategory =
  | "page-builder"
  | "seo"
  | "forms"
  | "ecommerce"
  | "multilingual"
  | "cache"
  | "analytics"
  | "security"
  | "other";

export interface DetectedPlugin {
  slug: string;
  name: string;
  category: PluginCategory;
}

export interface PluginScanResult {
  plugins: DetectedPlugin[];
  totalDetected: number;
}

export type IntegrationCategory =
  | "analytics"
  | "tag-manager"
  | "chat"
  | "heatmap"
  | "marketing"
  | "form-embed"
  | "scheduling"
  | "cookie-consent"
  | "other";

export interface DetectedIntegration {
  slug: string;
  name: string;
  category: IntegrationCategory;
}

export interface IntegrationScanResult {
  integrations: DetectedIntegration[];
  totalDetected: number;
}

export interface ScanResult {
  url: string;
  scannedAt: string;
  apiAvailable: boolean;
  contentTypes: ContentType[];
  urlStructure: UrlStructure | null;
  detectedPlugins: PluginScanResult | null;
  detectedIntegrations: IntegrationScanResult | null;
  errors: string[];
}

export type AnnotationSeverity = "info" | "warning" | "critical";

export type AnnotationSection = "content-types" | "plugins" | "url-structure" | "warnings" | "multilingual" | "integrations";

export interface Annotation {
  title: string;
  body: string;
  severity: AnnotationSeverity;
  section: AnnotationSection;
}

export interface MigrationConsideration {
  icon: string;
  color: "red" | "purple" | "orange" | "yellow" | "green" | "blue";
  title: string;
  body: string;
}

export interface MigrationScope {
  headline: string;
  considerations: MigrationConsideration[];
}
