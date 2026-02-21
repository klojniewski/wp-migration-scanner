export type Fetcher = typeof globalThis.fetch;

export const DEFAULT_HEADERS = { "User-Agent": "WP-Migration-Scanner/0.1" };

export function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    const h = parsed.hostname;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.)/.test(h)) return false;
    if (h === "localhost" || h === "[::1]" || h.endsWith(".internal") || h.endsWith(".local")) return false;
    if (!h.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function fetchXml(
  url: string,
  fetcher: Fetcher = globalThis.fetch,
  timeoutMs: number = 10_000,
): Promise<string | null> {
  try {
    const res = await fetcher(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes("<")) return null;
    return text;
  } catch {
    return null;
  }
}

export async function fetchJson(
  url: string,
  fetcher: Fetcher = globalThis.fetch,
  timeoutMs: number = 10_000,
): Promise<Response | null> {
  try {
    const res = await fetcher(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}
