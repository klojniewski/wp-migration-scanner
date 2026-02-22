import type { DetectedIntegration, IntegrationCategory, IntegrationScanResult } from "../types";

interface IntegrationSignature {
  slug: string;
  name: string;
  category: IntegrationCategory;
  test: (html: string) => boolean;
}

const KNOWN_INTEGRATIONS: IntegrationSignature[] = [
  // Analytics
  {
    slug: "google-analytics",
    name: "Google Analytics",
    category: "analytics",
    test: (html) =>
      html.includes("google-analytics.com/analytics.js") ||
      html.includes("googletagmanager.com/gtag/js"),
  },
  {
    slug: "facebook-pixel",
    name: "Facebook Pixel",
    category: "analytics",
    test: (html) => html.includes("connect.facebook.net") && html.includes("fbevents.js"),
  },
  {
    slug: "segment",
    name: "Segment",
    category: "analytics",
    test: (html) => html.includes("cdn.segment.com/analytics.js"),
  },
  {
    slug: "mixpanel",
    name: "Mixpanel",
    category: "analytics",
    test: (html) => html.includes("cdn.mxpnl.com") || html.includes("mixpanel.com/track"),
  },

  // Tag Manager
  {
    slug: "google-tag-manager",
    name: "Google Tag Manager",
    category: "tag-manager",
    test: (html) => html.includes("googletagmanager.com/gtm.js"),
  },

  // Heatmaps
  {
    slug: "hotjar",
    name: "Hotjar",
    category: "heatmap",
    test: (html) => html.includes("static.hotjar.com"),
  },
  {
    slug: "microsoft-clarity",
    name: "Microsoft Clarity",
    category: "heatmap",
    test: (html) => html.includes("clarity.ms/tag"),
  },
  {
    slug: "vwo",
    name: "VWO",
    category: "heatmap",
    test: (html) => html.includes("dev.visualwebsiteoptimizer.com"),
  },

  // Chat
  {
    slug: "intercom",
    name: "Intercom",
    category: "chat",
    test: (html) => html.includes("widget.intercom.io") || html.includes("js.intercomcdn.com"),
  },
  {
    slug: "drift",
    name: "Drift",
    category: "chat",
    test: (html) => html.includes("js.driftt.com"),
  },
  {
    slug: "crisp",
    name: "Crisp",
    category: "chat",
    test: (html) => html.includes("client.crisp.chat"),
  },
  {
    slug: "zendesk",
    name: "Zendesk",
    category: "chat",
    test: (html) => html.includes("static.zdassets.com") || html.includes("zopim.com"),
  },
  {
    slug: "livechat",
    name: "LiveChat",
    category: "chat",
    test: (html) => html.includes("cdn.livechatinc.com"),
  },
  {
    slug: "tidio",
    name: "Tidio",
    category: "chat",
    test: (html) => html.includes("code.tidio.co"),
  },
  {
    slug: "freshdesk",
    name: "Freshdesk",
    category: "chat",
    test: (html) => html.includes("wchat.freshchat.com"),
  },

  // Marketing
  {
    slug: "hubspot",
    name: "HubSpot",
    category: "marketing",
    test: (html) => html.includes("js.hs-scripts.com") || html.includes("js.hsforms.net"),
  },
  {
    slug: "mailchimp",
    name: "Mailchimp",
    category: "marketing",
    test: (html) => html.includes("chimpstatic.com") || html.includes("list-manage.com"),
  },
  {
    slug: "convertkit",
    name: "ConvertKit",
    category: "marketing",
    test: (html) => html.includes("convertkit.com"),
  },

  // Form Embeds
  {
    slug: "typeform",
    name: "Typeform",
    category: "form-embed",
    test: (html) => html.includes("embed.typeform.com"),
  },

  // Scheduling
  {
    slug: "calendly",
    name: "Calendly",
    category: "scheduling",
    test: (html) => html.includes("assets.calendly.com") || html.includes("calendly.com/"),
  },

  // Cookie Consent
  {
    slug: "cookiebot",
    name: "CookieBot",
    category: "cookie-consent",
    test: (html) => html.includes("consent.cookiebot.com"),
  },
  {
    slug: "cookieyes",
    name: "CookieYes",
    category: "cookie-consent",
    test: (html) => html.includes("cdn-cookieyes.com"),
  },
  {
    slug: "onetrust",
    name: "OneTrust",
    category: "cookie-consent",
    test: (html) => html.includes("cdn.cookielaw.org") || html.includes("optanon.blob.core.windows.net"),
  },
  {
    slug: "complianz",
    name: "Complianz",
    category: "cookie-consent",
    test: (html) => html.includes("complianz-gdpr") || /cmplz-/.test(html),
  },
  {
    slug: "termly",
    name: "Termly",
    category: "cookie-consent",
    test: (html) => html.includes("app.termly.io"),
  },
];

const CATEGORY_ORDER: IntegrationCategory[] = [
  "analytics", "tag-manager", "heatmap", "chat",
  "marketing", "form-embed", "scheduling", "cookie-consent", "other",
];
const ORDER_MAP = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));

/** Pure parser — detects third-party integrations from HTML string */
export function parseIntegrations(html: string): IntegrationScanResult {
  const found = new Map<string, DetectedIntegration>();

  for (const sig of KNOWN_INTEGRATIONS) {
    if (!found.has(sig.slug) && sig.test(html)) {
      found.set(sig.slug, { slug: sig.slug, name: sig.name, category: sig.category });
    }
  }

  const integrations = Array.from(found.values());
  integrations.sort((a, b) => {
    const catDiff = (ORDER_MAP.get(a.category) ?? 99) - (ORDER_MAP.get(b.category) ?? 99);
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name);
  });

  return { integrations, totalDetected: integrations.length };
}
