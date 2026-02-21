import type { UrlStructure, UrlPattern, MultilingualInfo } from "../types";

// Common language codes for subdirectory detection
const LANG_CODES = new Set([
  "en", "de", "fr", "es", "it", "pt", "nl", "pl", "sv", "da", "no", "fi",
  "cs", "sk", "hu", "ro", "bg", "hr", "sl", "sr", "uk", "ru", "ja", "zh",
  "ko", "ar", "he", "th", "vi", "id", "ms", "tr", "el", "ca", "eu", "gl",
  "pt-br", "zh-hans", "zh-hant", "en-us", "en-gb", "fr-ca", "es-mx",
]);

export function analyzeUrls(baseUrl: string, allUrls: string[]): UrlStructure {
  const baseHost = new URL(baseUrl).origin;
  const patterns = derivePatterns(baseHost, allUrls);
  const multilingual = detectMultilingual(baseHost, allUrls);

  return {
    totalIndexedUrls: allUrls.length,
    patterns,
    multilingual,
  };
}

function derivePatterns(baseHost: string, urls: string[]): UrlPattern[] {
  // Group by path depth and first segment to find patterns
  // e.g. /blog/post-slug/ → "/blog/{slug}/"
  //      /case-studies/acme/ → "/case-studies/{slug}/"
  //      /about/ → "/{page}/"

  const patternMap = new Map<string, { count: number; example: string }>();

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== baseHost) continue;

      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length === 0) continue;

      let pattern: string;

      if (pathParts.length === 1) {
        // Top-level page: /about/, /contact/
        pattern = "/{page}/";
      } else if (pathParts.length === 2) {
        // Two-level: /blog/my-post/ or /services/consulting/
        pattern = `/${pathParts[0]}/{slug}/`;
      } else {
        // Deeper: /blog/2024/01/my-post/ → /blog/{...}/
        pattern = `/${pathParts[0]}/{...}/`;
      }

      const existing = patternMap.get(pattern);
      if (existing) {
        existing.count++;
      } else {
        patternMap.set(pattern, { count: 1, example: parsed.pathname });
      }
    } catch {
      // skip malformed
    }
  }

  return Array.from(patternMap.entries())
    .map(([pattern, data]) => ({
      pattern,
      example: data.example,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);
}

function detectMultilingual(baseHost: string, urls: string[]): MultilingualInfo | null {
  // Strategy 1: Check for language subdirectories
  // e.g. /en/about/, /de/about/, /fr/about/
  const firstSegments = new Map<string, number>();

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== baseHost) continue;

      const firstPart = parsed.pathname.split("/").filter(Boolean)[0];
      if (firstPart && LANG_CODES.has(firstPart.toLowerCase())) {
        const lang = firstPart.toLowerCase();
        firstSegments.set(lang, (firstSegments.get(lang) || 0) + 1);
      }
    } catch {
      // skip
    }
  }

  // Need at least 2 different language prefixes to consider it multilingual
  if (firstSegments.size >= 2) {
    return {
      type: "subdirectory",
      languages: Array.from(firstSegments.keys()).sort(),
    };
  }

  // Strategy 2: Check for language subdomains
  // e.g. en.example.com, de.example.com
  const subdomains = new Set<string>();
  const baseDomain = new URL(baseHost).hostname;

  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname;
      if (hostname !== baseDomain && hostname.endsWith(baseDomain)) {
        const sub = hostname.replace(`.${baseDomain}`, "");
        if (LANG_CODES.has(sub.toLowerCase())) {
          subdomains.add(sub.toLowerCase());
        }
      }
    } catch {
      // skip
    }
  }

  if (subdomains.size >= 2) {
    return {
      type: "subdomain",
      languages: Array.from(subdomains).sort(),
    };
  }

  return null;
}
