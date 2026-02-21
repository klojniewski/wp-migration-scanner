import type { DetectedPlugin, PluginCategory, PluginScanResult } from "../types";

interface KnownPlugin {
  name: string;
  category: PluginCategory;
}

const KNOWN_PLUGINS = new Map<string, KnownPlugin>([
  // Page builders
  ["elementor", { name: "Elementor", category: "page-builder" }],
  ["elementor-pro", { name: "Elementor Pro", category: "page-builder" }],
  ["js_composer", { name: "WPBakery Page Builder", category: "page-builder" }],
  ["beaver-builder-lite-version", { name: "Beaver Builder", category: "page-builder" }],
  ["bb-plugin", { name: "Beaver Builder Pro", category: "page-builder" }],
  ["divi-builder", { name: "Divi Builder", category: "page-builder" }],
  ["oxygen", { name: "Oxygen Builder", category: "page-builder" }],
  ["brizy", { name: "Brizy", category: "page-builder" }],
  ["generateblocks", { name: "GenerateBlocks", category: "page-builder" }],
  ["spectra", { name: "Spectra", category: "page-builder" }],

  // SEO
  ["wordpress-seo", { name: "Yoast SEO", category: "seo" }],
  ["wordpress-seo-premium", { name: "Yoast SEO Premium", category: "seo" }],
  ["all-in-one-seo-pack", { name: "All in One SEO", category: "seo" }],
  ["seo-by-rank-math", { name: "Rank Math", category: "seo" }],
  ["the-seo-framework", { name: "The SEO Framework", category: "seo" }],

  // Forms
  ["contact-form-7", { name: "Contact Form 7", category: "forms" }],
  ["wpforms-lite", { name: "WPForms", category: "forms" }],
  ["wpforms", { name: "WPForms Pro", category: "forms" }],
  ["gravityforms", { name: "Gravity Forms", category: "forms" }],
  ["formidable", { name: "Formidable Forms", category: "forms" }],
  ["ninja-forms", { name: "Ninja Forms", category: "forms" }],
  ["fluentform", { name: "Fluent Forms", category: "forms" }],

  // E-commerce
  ["woocommerce", { name: "WooCommerce", category: "ecommerce" }],
  ["easy-digital-downloads", { name: "Easy Digital Downloads", category: "ecommerce" }],
  ["surecart", { name: "SureCart", category: "ecommerce" }],

  // Multilingual
  ["sitepress-multilingual-cms", { name: "WPML", category: "multilingual" }],
  ["polylang", { name: "Polylang", category: "multilingual" }],
  ["translatepress-multilingual", { name: "TranslatePress", category: "multilingual" }],

  // Cache / Performance
  ["wp-super-cache", { name: "WP Super Cache", category: "cache" }],
  ["w3-total-cache", { name: "W3 Total Cache", category: "cache" }],
  ["litespeed-cache", { name: "LiteSpeed Cache", category: "cache" }],
  ["wp-fastest-cache", { name: "WP Fastest Cache", category: "cache" }],
  ["autoptimize", { name: "Autoptimize", category: "cache" }],
  ["wp-rocket", { name: "WP Rocket", category: "cache" }],

  // Analytics
  ["google-site-kit", { name: "Google Site Kit", category: "analytics" }],
  ["google-analytics-for-wordpress", { name: "MonsterInsights", category: "analytics" }],

  // Security
  ["wordfence", { name: "Wordfence", category: "security" }],
  ["better-wp-security", { name: "iThemes Security", category: "security" }],
  ["sucuri-scanner", { name: "Sucuri Security", category: "security" }],
  ["all-in-one-wp-security-and-firewall", { name: "All-In-One Security", category: "security" }],
]);

interface SignatureMatch {
  slug: string;
  name: string;
  category: PluginCategory;
  test: (html: string) => boolean;
}

const SIGNATURES: SignatureMatch[] = [
  // Page builders — CSS class detection
  {
    slug: "elementor",
    name: "Elementor",
    category: "page-builder",
    test: (html) => /class="[^"]*elementor[-\s]/.test(html) || html.includes("elementor-kit-"),
  },
  {
    slug: "divi-builder",
    name: "Divi Builder",
    category: "page-builder",
    test: (html) => /class="[^"]*et_pb_/.test(html) || /id="et-boc"/.test(html),
  },
  {
    slug: "js_composer",
    name: "WPBakery Page Builder",
    category: "page-builder",
    test: (html) => /class="[^"]*vc_row/.test(html) || /class="[^"]*wpb_/.test(html),
  },

  // SEO — HTML comments and meta tags
  {
    slug: "wordpress-seo",
    name: "Yoast SEO",
    category: "seo",
    test: (html) => html.includes("<!-- This site is optimized with the Yoast"),
  },
  {
    slug: "seo-by-rank-math",
    name: "Rank Math",
    category: "seo",
    test: (html) => /name="rank-math"/.test(html) || html.includes("<!-- Rank Math"),
  },
  {
    slug: "all-in-one-seo-pack",
    name: "All in One SEO",
    category: "seo",
    test: (html) => html.includes("<!-- All in One SEO"),
  },

  // Forms — CSS classes
  {
    slug: "contact-form-7",
    name: "Contact Form 7",
    category: "forms",
    test: (html) => /class="[^"]*wpcf7[-\s"]/.test(html),
  },

  // E-commerce — body classes and elements
  {
    slug: "woocommerce",
    name: "WooCommerce",
    category: "ecommerce",
    test: (html) => /class="[^"]*woocommerce[-\s"]/.test(html),
  },

  // Cache — HTML comments
  {
    slug: "wp-rocket",
    name: "WP Rocket",
    category: "cache",
    test: (html) => html.includes("<!-- This website is like a Rocket"),
  },
  {
    slug: "litespeed-cache",
    name: "LiteSpeed Cache",
    category: "cache",
    test: (html) => html.includes("<!-- Page generated by LiteSpeed"),
  },
  {
    slug: "wp-super-cache",
    name: "WP Super Cache",
    category: "cache",
    test: (html) => html.includes("<!-- super cache"),
  },
  {
    slug: "w3-total-cache",
    name: "W3 Total Cache",
    category: "cache",
    test: (html) => html.includes("<!-- Performance optimized by W3 Total Cache"),
  },
  {
    slug: "wp-fastest-cache",
    name: "WP Fastest Cache",
    category: "cache",
    test: (html) => html.includes("<!-- WP Fastest Cache"),
  },

  // Multilingual
  {
    slug: "sitepress-multilingual-cms",
    name: "WPML",
    category: "multilingual",
    test: (html) => html.includes("wpml-ls-statics-css") || html.includes("sitepress-multilingual"),
  },
  {
    slug: "translatepress-multilingual",
    name: "TranslatePress",
    category: "multilingual",
    test: (html) => html.includes("trp-language-switcher"),
  },
];

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolvePlugin(slug: string): DetectedPlugin {
  const known = KNOWN_PLUGINS.get(slug);
  if (known) {
    return { slug, name: known.name, category: known.category };
  }
  return { slug, name: titleCase(slug), category: "other" };
}

export async function detectPlugins(baseUrl: string): Promise<PluginScanResult> {
  const res = await fetch(baseUrl, {
    headers: { "User-Agent": "WP-Migration-Scanner/0.1" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching homepage`);
  }

  const html = await res.text();
  const found = new Map<string, DetectedPlugin>();

  // Layer 1: Asset path extraction
  const assetRegex = /\/wp-content\/plugins\/([a-z0-9_-]+)\//gi;
  let match: RegExpExecArray | null;
  while ((match = assetRegex.exec(html)) !== null) {
    const slug = match[1].toLowerCase();
    if (!found.has(slug)) {
      found.set(slug, resolvePlugin(slug));
    }
  }

  // Layer 2: HTML signature matching (only adds new findings)
  for (const sig of SIGNATURES) {
    if (!found.has(sig.slug) && sig.test(html)) {
      found.set(sig.slug, { slug: sig.slug, name: sig.name, category: sig.category });
    }
  }

  const plugins = Array.from(found.values());

  // Sort by category order, then alphabetically within category
  const categoryOrder: PluginCategory[] = [
    "page-builder", "seo", "forms", "ecommerce",
    "multilingual", "cache", "analytics", "security", "other",
  ];
  const orderMap = new Map(categoryOrder.map((c, i) => [c, i]));
  plugins.sort((a, b) => {
    const catDiff = (orderMap.get(a.category) ?? 99) - (orderMap.get(b.category) ?? 99);
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name);
  });

  return { plugins, totalDetected: plugins.length };
}
