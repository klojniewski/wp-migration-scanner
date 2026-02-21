export interface TaxonomyRef {
  name: string;
  slug: string;
  count: number;
}

export interface ContentType {
  name: string;
  slug: string;
  count: number;
  isEstimate: boolean;
  samples: string[];
  taxonomies: TaxonomyRef[];
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

export interface ScanResult {
  url: string;
  scannedAt: string;
  apiAvailable: boolean;
  contentTypes: ContentType[];
  urlStructure: UrlStructure | null;
  detectedPlugins: PluginScanResult | null;
  errors: string[];
}
