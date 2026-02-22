import { describe, it, expect } from "vitest";
import { parseIntegrations } from "./integrations";

describe("parseIntegrations", () => {
  // Analytics
  it("detects Google Analytics via analytics.js", () => {
    const html = `<script src="https://www.google-analytics.com/analytics.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "google-analytics")).toBeDefined();
  });

  it("detects Google Analytics via gtag.js", () => {
    const html = `<script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "google-analytics")).toBeDefined();
  });

  it("detects Facebook Pixel", () => {
    const html = `<script src="https://connect.facebook.net/en_US/fbevents.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "facebook-pixel")).toBeDefined();
  });

  it("detects Segment", () => {
    const html = `<script src="https://cdn.segment.com/analytics.js/v1/abc123/analytics.min.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "segment")).toBeDefined();
  });

  it("detects Mixpanel", () => {
    const html = `<script src="https://cdn.mxpnl.com/libs/mixpanel.min.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "mixpanel")).toBeDefined();
  });

  // Tag Manager
  it("detects Google Tag Manager", () => {
    const html = `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime()});})(window,document,'script','dataLayer','GTM-XXXX');</script>
    <script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "google-tag-manager")).toBeDefined();
  });

  // Heatmaps
  it("detects Hotjar", () => {
    const html = `<script src="https://static.hotjar.com/c/hotjar-12345.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "hotjar")).toBeDefined();
    expect(result.integrations.find((i) => i.slug === "hotjar")!.category).toBe("heatmap");
  });

  it("detects Microsoft Clarity", () => {
    const html = `<script src="https://www.clarity.ms/tag/abc123"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "microsoft-clarity")).toBeDefined();
  });

  it("detects VWO", () => {
    const html = `<script src="https://dev.visualwebsiteoptimizer.com/lib/12345.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "vwo")).toBeDefined();
  });

  // Chat
  it("detects Intercom via widget.intercom.io", () => {
    const html = `<script src="https://widget.intercom.io/widget/abc123"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "intercom")).toBeDefined();
    expect(result.integrations.find((i) => i.slug === "intercom")!.category).toBe("chat");
  });

  it("detects Intercom via intercomcdn", () => {
    const html = `<script src="https://js.intercomcdn.com/shim.latest.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "intercom")).toBeDefined();
  });

  it("detects Drift", () => {
    const html = `<script src="https://js.driftt.com/include/12345/abc.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "drift")).toBeDefined();
  });

  it("detects Crisp", () => {
    const html = `<script src="https://client.crisp.chat/l.js" async></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "crisp")).toBeDefined();
  });

  it("detects Zendesk via zdassets", () => {
    const html = `<script src="https://static.zdassets.com/ekr/snippet.js?key=abc"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "zendesk")).toBeDefined();
  });

  it("detects Zendesk via zopim", () => {
    const html = `<script src="https://v2.zopim.com/?abc123"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "zendesk")).toBeDefined();
  });

  it("detects LiveChat", () => {
    const html = `<script src="https://cdn.livechatinc.com/tracking.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "livechat")).toBeDefined();
  });

  it("detects Tidio", () => {
    const html = `<script src="https://code.tidio.co/abc123.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "tidio")).toBeDefined();
  });

  it("detects Freshdesk", () => {
    const html = `<script src="https://wchat.freshchat.com/js/widget.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "freshdesk")).toBeDefined();
  });

  // Marketing
  it("detects HubSpot", () => {
    const html = `<script src="https://js.hs-scripts.com/12345.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "hubspot")).toBeDefined();
    expect(result.integrations.find((i) => i.slug === "hubspot")!.category).toBe("marketing");
  });

  it("detects Mailchimp", () => {
    const html = `<script src="https://chimpstatic.com/mcjs_connected/js/users/abc.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "mailchimp")).toBeDefined();
  });

  it("detects ConvertKit", () => {
    const html = `<script src="https://f.convertkit.com/12345/abc.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "convertkit")).toBeDefined();
  });

  // Form Embeds
  it("detects Typeform via embed", () => {
    const html = `<iframe src="https://embed.typeform.com/to/abc123"></iframe>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "typeform")).toBeDefined();
    expect(result.integrations.find((i) => i.slug === "typeform")!.category).toBe("form-embed");
  });

  // Scheduling
  it("detects Calendly via assets", () => {
    const html = `<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "calendly")).toBeDefined();
    expect(result.integrations.find((i) => i.slug === "calendly")!.category).toBe("scheduling");
  });

  it("detects Calendly via iframe", () => {
    const html = `<iframe src="https://calendly.com/user/meeting" frameborder="0"></iframe>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "calendly")).toBeDefined();
  });

  // Cookie Consent
  it("detects CookieBot", () => {
    const html = `<script src="https://consent.cookiebot.com/uc.js" data-cbid="abc"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "cookiebot")).toBeDefined();
    expect(result.integrations.find((i) => i.slug === "cookiebot")!.category).toBe("cookie-consent");
  });

  it("detects CookieYes", () => {
    const html = `<script src="https://cdn-cookieyes.com/client_data/abc.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "cookieyes")).toBeDefined();
  });

  it("detects OneTrust via cookielaw", () => {
    const html = `<script src="https://cdn.cookielaw.org/scripttemplates/otBannerSdk.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "onetrust")).toBeDefined();
  });

  it("detects OneTrust via optanon", () => {
    const html = `<script src="https://optanon.blob.core.windows.net/consent/abc.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "onetrust")).toBeDefined();
  });

  it("detects Complianz via class name", () => {
    const html = `<div id="complianz-gdpr">Cookie banner</div>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "complianz")).toBeDefined();
  });

  it("detects Complianz via cmplz- prefix", () => {
    const html = `<script src="/wp-content/plugins/complianz-gdpr/assets/js/cmplz-cookiebanner.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "complianz")).toBeDefined();
  });

  it("detects Termly", () => {
    const html = `<script src="https://app.termly.io/embed.min.js"></script>`;
    const result = parseIntegrations(html);
    expect(result.integrations.find((i) => i.slug === "termly")).toBeDefined();
  });

  // Edge cases
  it("deduplicates — same service matched by two patterns counts once", () => {
    const html = `
      <script src="https://widget.intercom.io/widget/abc"></script>
      <script src="https://js.intercomcdn.com/shim.latest.js"></script>
    `;
    const result = parseIntegrations(html);
    const intercomMatches = result.integrations.filter((i) => i.slug === "intercom");
    expect(intercomMatches).toHaveLength(1);
  });

  it("returns empty result for HTML with no integrations", () => {
    const html = `<html><body><h1>Hello</h1></body></html>`;
    const result = parseIntegrations(html);
    expect(result.totalDetected).toBe(0);
    expect(result.integrations).toEqual([]);
  });

  it("handles empty string", () => {
    const result = parseIntegrations("");
    expect(result.totalDetected).toBe(0);
  });

  it("sorts by category order then alphabetically", () => {
    const html = `
      <script src="https://js.driftt.com/include/123/abc.js"></script>
      <script src="https://static.hotjar.com/c/hotjar-123.js"></script>
      <script src="https://www.google-analytics.com/analytics.js"></script>
      <script src="https://consent.cookiebot.com/uc.js"></script>
    `;
    const result = parseIntegrations(html);
    expect(result.integrations[0].category).toBe("analytics");
    expect(result.integrations[1].category).toBe("heatmap");
    expect(result.integrations[2].category).toBe("chat");
    expect(result.integrations[3].category).toBe("cookie-consent");
  });

  it("detects multiple services from realistic HTML", () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"></script>
        <script src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
        <script src="https://static.hotjar.com/c/hotjar-123.js"></script>
        <script src="https://js.hs-scripts.com/123.js"></script>
        <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
        <script src="https://consent.cookiebot.com/uc.js" data-cbid="abc"></script>
      </head>
      <body>
        <script src="https://widget.intercom.io/widget/abc"></script>
      </body>
      </html>
    `;
    const result = parseIntegrations(html);
    expect(result.totalDetected).toBe(7);
    const slugs = result.integrations.map((i) => i.slug);
    expect(slugs).toContain("google-analytics");
    expect(slugs).toContain("google-tag-manager");
    expect(slugs).toContain("hotjar");
    expect(slugs).toContain("hubspot");
    expect(slugs).toContain("intercom");
    expect(slugs).toContain("calendly");
    expect(slugs).toContain("cookiebot");
  });
});
