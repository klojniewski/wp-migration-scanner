/**
 * A scan targets a site *scope*: an origin plus an optional base path.
 * `https://pagepro.co/blog` scopes the scan to the WordPress install under
 * /blog, even though the root of the domain runs a different stack.
 */
export interface SiteScope {
  origin: string;
  basePath: string; // "" for root installs, otherwise "/blog" (no trailing slash)
}

export function getScope(baseUrl: string): SiteScope {
  const u = new URL(baseUrl);
  return { origin: u.origin, basePath: u.pathname.replace(/\/+$/, "") };
}

/**
 * Path segments of `url` relative to the scope's base path, or null when the
 * URL lies outside the scope (other origin, or a sibling path like /services
 * when scanning /blog).
 */
export function scopedParts(url: string, scope: SiteScope): string[] | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.origin !== scope.origin) return null;
  const path = parsed.pathname;
  if (scope.basePath) {
    if (path !== scope.basePath && !path.startsWith(`${scope.basePath}/`)) return null;
  }
  return path.slice(scope.basePath.length).split("/").filter(Boolean);
}

export function isInScope(url: string, scope: SiteScope): boolean {
  return scopedParts(url, scope) !== null;
}
