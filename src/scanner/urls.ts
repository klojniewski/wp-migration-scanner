import type { UrlStructure, UrlPattern, MultilingualInfo } from "../types";

// ISO 639-1 language codes (2-letter) used as the base for locale detection.
// Region/script suffixes (e.g. "en-us", "de-de", "zh-hans") are matched
// generically against these, so we don't need to enumerate every locale.
const LANGUAGE_CODES = new Set([
  "en", "de", "fr", "es", "it", "pt", "nl", "pl", "sv", "da", "no", "fi",
  "cs", "sk", "hu", "ro", "bg", "hr", "sl", "sr", "uk", "ru", "ja", "zh",
  "ko", "ar", "he", "th", "vi", "id", "ms", "tr", "el", "ca", "eu", "gl",
  "nb", "nn", "et", "lv", "lt", "is", "ga", "mt", "sq", "mk", "be", "ka",
  "hi", "bn", "ta", "te", "ml", "kn", "mr", "gu", "pa", "ur", "fa", "af",
  "hy", "az", "kk", "uz", "cy", "lb", "fo", "km", "lo", "my", "si", "ne",
]);

/**
 * Returns a normalized locale string when `segment` looks like a language or
 * language-region/script code (e.g. "en", "en-us", "de-de", "zh-hans"), or
 * null otherwise. The leading two letters must be a known language code.
 */
function parseLocaleSegment(segment: string): string | null {
  const s = segment.toLowerCase();
  const match = /^([a-z]{2})(?:-([a-z]{2,4}))?$/.exec(s);
  if (!match) return null;
  if (!LANGUAGE_CODES.has(match[1])) return null;
  return s;
}

/**
 * Given counts of recognized locale segments, drops stray matches that are
 * almost certainly noise (e.g. a lone PDF under /en/) once the site clearly
 * uses locale prefixes at scale. Small sites keep every match.
 */
function filterSignificantLocales(counts: Map<string, number>): string[] {
  const maxCount = Math.max(...counts.values());
  // Only apply a minimum threshold once some locale is used at scale; this
  // keeps tiny multilingual sites (1 page per language) working.
  const minCount = maxCount > 2 ? 2 : 1;
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .map(([lang]) => lang)
    .sort();
}

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
      if (!firstPart) continue;
      const lang = parseLocaleSegment(firstPart);
      if (lang) {
        firstSegments.set(lang, (firstSegments.get(lang) || 0) + 1);
      }
    } catch {
      // skip
    }
  }

  // Need at least 2 different language prefixes to consider it multilingual
  if (firstSegments.size >= 2) {
    const languages = filterSignificantLocales(firstSegments);
    if (languages.length >= 2) {
      return {
        type: "subdirectory",
        languages,
      };
    }
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
        const lang = parseLocaleSegment(sub);
        if (lang) {
          subdomains.add(lang);
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
