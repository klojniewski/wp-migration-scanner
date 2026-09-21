import type { UrlStructure, UrlPattern, MultilingualInfo } from "../types";

// ISO 639-1 language codes used to validate the language part of a locale
// segment. We detect the *pattern* of a locale (e.g. "de-de", "en-nl") rather
// than relying on a fixed whitelist of full locales, which never keeps up with
// region variants sites actually use.
const ISO_639_1 = new Set([
  "aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az",
  "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo", "br", "bs", "ca", "ce",
  "ch", "co", "cr", "cs", "cu", "cv", "cy", "da", "de", "dv", "dz", "ee",
  "el", "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fo", "fr",
  "fy", "ga", "gd", "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr",
  "ht", "hu", "hy", "hz", "ia", "id", "ie", "ig", "ii", "ik", "io", "is",
  "it", "iu", "ja", "jv", "ka", "kg", "ki", "kj", "kk", "kl", "km", "kn",
  "ko", "kr", "ks", "ku", "kv", "kw", "ky", "la", "lb", "lg", "li", "ln",
  "lo", "lt", "lu", "lv", "mg", "mh", "mi", "mk", "ml", "mn", "mr", "ms",
  "mt", "my", "na", "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv",
  "ny", "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps", "pt", "qu",
  "rm", "rn", "ro", "ru", "rw", "sa", "sc", "sd", "se", "sg", "si", "sk",
  "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "ta",
  "te", "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw",
  "ty", "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi",
  "yo", "za", "zh", "zu",
]);

// Matches "xx" or "xx-yy" / "xx-yyy" (language plus optional region/script).
const LOCALE_SEGMENT = /^([a-z]{2})(?:-[a-z0-9]{2,4})?$/;

// Returns the normalized locale (e.g. "en-us") when a path segment looks like a
// language/locale directory, otherwise null.
function matchLocaleSegment(segment: string): string | null {
  const lower = segment.toLowerCase();
  const m = LOCALE_SEGMENT.exec(lower);
  if (!m) return null;
  if (!ISO_639_1.has(m[1])) return null;
  return lower;
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
      const lang = firstPart ? matchLocaleSegment(firstPart) : null;
      if (lang) {
        firstSegments.set(lang, (firstSegments.get(lang) || 0) + 1);
      }
    } catch {
      // skip
    }
  }

  // Drop noise: a handful of stray files under a bare language folder
  // (e.g. a single /de/terms.pdf) should not count as a full locale next to
  // locales carrying hundreds of pages. The threshold scales with the largest
  // locale so small multilingual sites still keep all their languages.
  const maxCount = Math.max(0, ...firstSegments.values());
  const threshold = Math.max(1, Math.floor(maxCount * 0.02));
  const languages = Array.from(firstSegments.entries())
    .filter(([, count]) => count >= threshold)
    .map(([lang]) => lang)
    .sort();

  // Need at least 2 different language prefixes to consider it multilingual
  if (languages.length >= 2) {
    return {
      type: "subdirectory",
      languages,
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
        const lang = matchLocaleSegment(sub);
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
