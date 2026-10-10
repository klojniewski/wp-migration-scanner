import type { MigrationConsideration, MigrationScope, ScanResult } from "@/types";

interface AuditPostType {
  post_type: string;
  total: number;
  by_status?: Record<string, number>;
  label?: string;
  public?: boolean;
  rest_base?: string | null;
  built_in?: boolean;
  machinery?: boolean;
  url_pattern?: string | null;
}

interface AuditTaxonomy {
  taxonomy: string;
  label?: string;
  public?: boolean;
  hierarchical?: boolean;
  applies_to?: string[];
  terms?: number;
  empty_terms?: number;
  machinery?: boolean;
}

interface AuditBlock {
  name: string;
  items: number;
  occurrences: number;
  core: boolean;
}

interface AuditShortcode {
  tag: string;
  items: number;
  occurrences: number;
  registered_here?: boolean;
  credible?: boolean;
}

interface AuditPlugin {
  name: string;
  version?: string;
  active: boolean;
}

export interface ServerAudit {
  generated: string;
  environment: {
    site?: { home?: string; multisite?: boolean; permalink?: string; language?: string };
    versions?: { wordpress?: string; php?: string; database?: string };
    theme?: { name?: string; parent?: string | null; version?: string };
    plugins?: AuditPlugin[];
    multilingual?: {
      wpml?: boolean;
      polylang?: boolean;
      locales_accepted?: string[];
    };
    db_bytes?: number;
  };
  content: {
    scanned?: number;
    shortcodes?: { by_tag?: AuditShortcode[] };
    blocks?: { core?: number; third_party?: number; reusable_refs?: number; by_name?: AuditBlock[] };
    builders?: {
      by_content?: Record<string, number>;
      by_meta_key?: { key: string; label: string; kind: string; items: number }[];
    };
    post_types?: AuditPostType[];
    taxonomies?: AuditTaxonomy[];
    meta_keys?: {
      field_model?: { acf_detected?: boolean; field_paths?: number; content_keys?: number };
    };
    templates?: { template: string; n: number }[];
  };
  carry?: {
    revisions?: { revisions?: number; autosaves?: number };
    comments?: { total?: number; approved?: number; by_state?: Record<string, number> };
    authors?: { distinct_authors?: number };
    hierarchy?: { types?: { post_type: string; max_depth: number; orphans: number }[] };
    menus?: { menus?: { name: string; items: number }[]; broken_items?: number };
    media?: { total?: number; by_group?: Record<string, number> };
    redirects?: { sources?: { source: string; rules: number }[] };
    slugs?: { colliding_slugs?: number; items_no_slug?: number };
  };
}

export class AuditParseError extends Error {}

export function parseServerAudit(raw: string): ServerAudit {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new AuditParseError("File is not valid JSON.");
  }
  const obj = json as Partial<ServerAudit> | null;
  if (
    !obj ||
    typeof obj !== "object" ||
    typeof obj.environment !== "object" ||
    typeof obj.content !== "object" ||
    !Array.isArray(obj.content?.post_types)
  ) {
    throw new AuditParseError(
      "This doesn't look like a server-side migration audit (missing environment / content.post_types)."
    );
  }
  return obj as ServerAudit;
}

const NON_MIGRATABLE_STATUSES = new Set(["trash", "auto-draft", "inherit"]);

export interface AuditContentRow {
  postType: string;
  label: string;
  published: number;
  unpublished: number;
  isPublic: boolean;
  urlPattern: string | null;
  scanCount: number | null;
}

export interface AuditPluginRow {
  name: string;
  version?: string;
  active: boolean;
  seenByScan: boolean;
}

export interface AuditAnalysis {
  siteHome: string | null;
  domainMatches: boolean;
  generated: string;
  environment: {
    wordpress: string | null;
    php: string | null;
    database: string | null;
    theme: string | null;
    permalink: string | null;
    language: string | null;
    multisite: boolean;
    dbMegabytes: number | null;
    phpOutdated: boolean;
  };
  content: AuditContentRow[];
  hiddenContent: AuditContentRow[];
  totals: { migratable: number; published: number; unpublished: number };
  taxonomies: { name: string; terms: number; appliesTo: string[] }[];
  customBlocks: AuditBlock[];
  coreBlockCount: number;
  reusableRefs: number;
  credibleShortcodes: AuditShortcode[];
  builders: Record<string, number>;
  seoMeta: { label: string; items: number }[];
  fields: { acfDetected: boolean; fieldPaths: number; contentKeys: number };
  carry: {
    media: number;
    mediaByGroup: Record<string, number>;
    comments: number;
    approvedComments: number;
    spamComments: number;
    revisions: number;
    authors: number;
    menuItems: number;
    menus: number;
    redirects: number;
    slugCollisions: number;
    orphans: number;
  };
  plugins: AuditPluginRow[];
  multilingualPlugin: string | null;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .split(/[:\-–—|]/)[0]
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function pluginSeenByScan(auditName: string, scanNames: string[]): boolean {
  const a = normalizeName(auditName);
  if (!a) return false;
  return scanNames.some((s) => {
    const b = normalizeName(s);
    return b.length > 2 && (a.includes(b) || b.includes(a));
  });
}

function hostOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function majorMinor(version: string | null): number {
  if (!version) return NaN;
  const [maj, min] = version.split(".").map(Number);
  return maj + (min || 0) / 10;
}

function findScanCount(scan: ScanResult, pt: AuditPostType): number | null {
  const candidates = [pt.post_type, pt.rest_base, `${pt.post_type}s`].filter(Boolean) as string[];
  const match = scan.contentTypes.find((ct) => candidates.includes(ct.slug));
  return match ? match.count : null;
}

export function analyzeAudit(scan: ScanResult, audit: ServerAudit): AuditAnalysis {
  const env = audit.environment ?? {};
  const content = audit.content ?? {};
  const carry = audit.carry ?? {};

  const rows: AuditContentRow[] = (content.post_types ?? [])
    .filter((pt) => !pt.machinery && pt.post_type !== "attachment" && pt.total > 0)
    .map((pt) => {
      const statuses = pt.by_status ?? { publish: pt.total };
      let published = 0;
      let unpublished = 0;
      for (const [status, n] of Object.entries(statuses)) {
        if (NON_MIGRATABLE_STATUSES.has(status)) continue;
        if (status === "publish") published += n;
        else unpublished += n;
      }
      return {
        postType: pt.post_type,
        label: pt.label && pt.label !== "Posts" ? pt.label : pt.post_type === "post" ? "Posts" : pt.post_type,
        published,
        unpublished,
        isPublic: pt.public === true,
        urlPattern: pt.url_pattern ?? null,
        scanCount: findScanCount(scan, pt),
      };
    })
    .filter((r) => r.published + r.unpublished > 0)
    .sort((a, b) => b.published + b.unpublished - (a.published + a.unpublished));

  const hiddenContent = rows.filter(
    (r) => !r.isPublic && r.postType !== "wp_block" && r.scanCount === null
  );

  const totals = rows.reduce(
    (acc, r) => ({
      migratable: acc.migratable + r.published + r.unpublished,
      published: acc.published + r.published,
      unpublished: acc.unpublished + r.unpublished,
    }),
    { migratable: 0, published: 0, unpublished: 0 }
  );

  const blocks = content.blocks?.by_name ?? [];
  const customBlocks = blocks.filter((b) => !b.core).sort((a, b) => b.items - a.items);

  const scanPluginNames = scan.detectedPlugins?.plugins.map((p) => p.name) ?? [];
  const plugins: AuditPluginRow[] = (env.plugins ?? [])
    .map((p) => ({
      name: p.name,
      version: p.version,
      active: p.active,
      seenByScan: pluginSeenByScan(p.name, scanPluginNames),
    }))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  const php = env.versions?.php ?? null;
  const ml = env.multilingual;
  const multilingualPlugin = ml?.wpml ? "WPML" : ml?.polylang ? "Polylang" : null;

  const commentsByState = carry.comments?.by_state ?? {};

  return {
    siteHome: env.site?.home ?? null,
    domainMatches: (() => {
      const a = hostOf(env.site?.home);
      const b = hostOf(scan.url);
      return !a || !b || a === b;
    })(),
    generated: audit.generated,
    environment: {
      wordpress: env.versions?.wordpress ?? null,
      php,
      database: env.versions?.database ?? null,
      theme: env.theme?.name
        ? `${env.theme.name}${env.theme.parent ? ` (child of ${env.theme.parent})` : ""}`
        : null,
      permalink: env.site?.permalink ?? null,
      language: env.site?.language ?? null,
      multisite: env.site?.multisite === true,
      dbMegabytes: env.db_bytes ? Math.round(env.db_bytes / 1024 / 1024) : null,
      phpOutdated: majorMinor(php) < 8.1,
    },
    content: rows,
    hiddenContent,
    totals,
    taxonomies: (content.taxonomies ?? [])
      .filter((t) => !t.machinery && (t.applies_to?.length ?? 0) > 0)
      .map((t) => ({ name: t.label ?? t.taxonomy, terms: t.terms ?? 0, appliesTo: t.applies_to ?? [] })),
    customBlocks,
    coreBlockCount: content.blocks?.core ?? blocks.filter((b) => b.core).length,
    reusableRefs: content.blocks?.reusable_refs ?? 0,
    credibleShortcodes: (content.shortcodes?.by_tag ?? []).filter((s) => s.credible),
    builders: content.builders?.by_content ?? {},
    seoMeta: (content.builders?.by_meta_key ?? [])
      .filter((m) => m.kind === "seo")
      .map((m) => ({ label: m.label, items: m.items })),
    fields: {
      acfDetected: content.meta_keys?.field_model?.acf_detected === true,
      fieldPaths: content.meta_keys?.field_model?.field_paths ?? 0,
      contentKeys: content.meta_keys?.field_model?.content_keys ?? 0,
    },
    carry: {
      media: carry.media?.total ?? 0,
      mediaByGroup: carry.media?.by_group ?? {},
      comments: carry.comments?.total ?? 0,
      approvedComments: carry.comments?.approved ?? 0,
      spamComments: commentsByState.spam ?? 0,
      revisions: carry.revisions?.revisions ?? 0,
      authors: carry.authors?.distinct_authors ?? 0,
      menuItems: (carry.menus?.menus ?? []).reduce((s, m) => s + m.items, 0),
      menus: carry.menus?.menus?.length ?? 0,
      redirects: (carry.redirects?.sources ?? []).reduce((s, r) => s + r.rules, 0),
      slugCollisions: carry.slugs?.colliding_slugs ?? 0,
      orphans: (carry.hierarchy?.types ?? []).reduce((s, t) => s + t.orphans, 0),
    },
    plugins,
    multilingualPlugin,
  };
}

function sizeLabel(items: number): string {
  if (items < 100) return "Small";
  if (items < 500) return "Medium";
  return "Large";
}

function plural(n: number, word: string): string {
  return `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
}

export function generateFullMigrationScope(
  scan: ScanResult,
  analysis: AuditAnalysis,
  baseScope: MigrationScope
): MigrationScope {
  const a = analysis;
  const typeCount = a.content.filter((r) => r.postType !== "wp_block").length;
  const langs = scan.urlStructure?.multilingual?.languages.length ?? 0;
  const env = a.environment;

  const headline =
    `${sizeLabel(a.totals.migratable)} WordPress ${env.wordpress ?? ""} site${env.php ? ` on PHP ${env.php}` : ""}` +
    `${langs > 1 ? `, ${langs} languages` : ""}. ` +
    `${a.totals.migratable.toLocaleString()} migratable items across ${typeCount} content types ` +
    `(${a.totals.published.toLocaleString()} published), ${plural(a.carry.media, "media file")}, ` +
    `${plural(a.customBlocks.length, "custom block")} to rebuild` +
    `${a.carry.redirects > 0 ? ` and ${plural(a.carry.redirects, "redirect")} to carry over` : ""}.`;

  const c: MigrationConsideration[] = [];

  if (a.customBlocks.length > 0) {
    const top = a.customBlocks.slice(0, 4).map((b) => `${b.name} (${b.items})`).join(", ");
    c.push({
      icon: "⚠",
      color: "red",
      title: "Custom blocks to rebuild",
      body: `${plural(a.customBlocks.length, "third-party block")} in content — each needs an equivalent component in the target CMS. Most used: ${top}. ${a.coreBlockCount} core block types port mechanically.${a.reusableRefs > 0 ? ` ${plural(a.reusableRefs, "reusable block reference")} must be resolved before export.` : ""}`,
    });
  }

  if (a.fields.acfDetected && a.fields.fieldPaths > 0) {
    c.push({
      icon: "◈",
      color: "yellow",
      title: "Custom field model (ACF)",
      body: `${plural(a.fields.fieldPaths, "ACF field path")} across ${a.fields.contentKeys} content meta keys. These define the target schema and need explicit field-by-field mapping.`,
    });
  }

  if (a.hiddenContent.length > 0) {
    const list = a.hiddenContent
      .map((r) => `${r.label} (${(r.published + r.unpublished).toLocaleString()})`)
      .join(", ");
    c.push({
      icon: "◉",
      color: "purple",
      title: "Content invisible to the public scan",
      body: `Non-public content types found only in the server audit: ${list}. Decide whether each is migrated, archived or dropped.`,
    });
  }

  if (a.totals.unpublished > 0) {
    c.push({
      icon: "✎",
      color: "blue",
      title: "Unpublished content",
      body: `${plural(a.totals.unpublished, "draft/private/scheduled item")} exist next to ${a.totals.published.toLocaleString()} published. Agree whether drafts move to the new CMS.`,
    });
  }

  if (a.carry.redirects > 0) {
    c.push({
      icon: "↪",
      color: "orange",
      title: "Redirects to preserve",
      body: `${plural(a.carry.redirects, "redirect rule")} in the database. Export and re-create them at the edge/CMS to protect SEO; also check .htaccess and CDN rules, which the audit cannot see.`,
    });
  }

  if (a.seoMeta.length > 0) {
    const seo = a.seoMeta.map((m) => `${m.label.toLowerCase()} on ${m.items}`).join(", ");
    c.push({
      icon: "⌕",
      color: "blue",
      title: "SEO metadata",
      body: `Hand-written SEO meta to migrate: ${seo} items. Map to the target CMS SEO fields so titles and descriptions are not lost.`,
    });
  }

  if (a.credibleShortcodes.length > 0) {
    c.push({
      icon: "[ ]",
      color: "yellow",
      title: "Shortcodes in content",
      body: `${plural(a.credibleShortcodes.length, "confirmed shortcode")} (${a.credibleShortcodes.map((s) => s.tag).join(", ")}) must be converted or stripped during content transformation.`,
    });
  }

  if (a.carry.comments > 0) {
    c.push({
      icon: "✉",
      color: a.carry.approvedComments < a.carry.comments * 0.1 ? "green" : "orange",
      title: "Comments",
      body: `${a.carry.comments.toLocaleString()} comments, only ${a.carry.approvedComments.toLocaleString()} approved${a.carry.spamComments ? ` (${a.carry.spamComments.toLocaleString()} spam)` : ""}. Likely migrate approved only — or drop comments entirely.`,
    });
  }

  if (a.carry.media > 0) {
    const groups = Object.entries(a.carry.mediaByGroup)
      .sort((x, y) => y[1] - x[1])
      .map(([g, n]) => `${n.toLocaleString()} ${g}`)
      .join(", ");
    c.push({
      icon: "▣",
      color: "blue",
      title: "Media library",
      body: `${plural(a.carry.media, "attachment")} (${groups}). Plan bulk transfer to the new asset store and URL rewriting inside content.`,
    });
  }

  if (env.phpOutdated && env.php) {
    c.push({
      icon: "!",
      color: "red",
      title: "Outdated runtime",
      body: `PHP ${env.php} is end-of-life. Export tooling and plugin updates may fail — run exports from a staging copy if needed.`,
    });
  }

  const inactive = a.plugins.filter((p) => !p.active).length;
  const activeHidden = a.plugins.filter((p) => p.active && !p.seenByScan).length;
  if (a.plugins.length > 0) {
    c.push({
      icon: "⬡",
      color: "orange",
      title: "Plugin inventory",
      body: `${a.plugins.length - inactive} active plugins (${activeHidden} not detectable from the frontend)${inactive > 0 ? ` and ${inactive} inactive ones that can be ignored` : ""}. Each active plugin's functionality needs a replacement decision.`,
    });
  }

  if (scan.urlStructure?.multilingual && !a.multilingualPlugin) {
    c.push({
      icon: "⟠",
      color: "purple",
      title: "Multilingual without WPML/Polylang",
      body: `URLs show ${langs} locales but no standard multilingual plugin is active — translations are likely separate sites, a multisite or custom routing. Confirm how language versions are linked before modelling.`,
    });
  } else if (a.multilingualPlugin) {
    c.push({
      icon: "⟠",
      color: "purple",
      title: `Multilingual via ${a.multilingualPlugin}`,
      body: `${a.multilingualPlugin} manages translations — translation links can be exported and mapped to the target CMS locale model.`,
    });
  }

  if (a.carry.slugCollisions > 0 || a.carry.orphans > 0) {
    c.push({
      icon: "⚑",
      color: "yellow",
      title: "Data integrity issues",
      body: `${plural(a.carry.slugCollisions, "slug collision")} across post types and ${plural(a.carry.orphans, "orphaned child page")}. Resolve before import.`,
    });
  }

  const dropped = a.carry.revisions;
  if (dropped > 0) {
    c.push({
      icon: "✓",
      color: "green",
      title: "Safe to drop",
      body: `${plural(dropped, "revision")}${inactive > 0 ? `, ${plural(inactive, "inactive plugin")}` : ""} and plugin log tables do not need migrating — real scope is smaller than the database suggests.`,
    });
  }

  const keepFromScan = baseScope.considerations.filter((b) =>
    ["Page builder dependency", "Third-party integration complexity"].includes(b.title)
  );

  return { headline, considerations: [...c, ...keepFromScan] };
}
