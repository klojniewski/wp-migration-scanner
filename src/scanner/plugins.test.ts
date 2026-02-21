import { describe, it, expect } from "vitest";
import { parsePluginSignatures } from "./plugins";

describe("parsePluginSignatures", () => {
  it("detects plugins from asset paths", () => {
    const html = `
      <link rel="stylesheet" href="/wp-content/plugins/elementor/assets/css/frontend.css">
      <script src="/wp-content/plugins/contact-form-7/includes/js/scripts.js"></script>
    `;
    const result = parsePluginSignatures(html);
    expect(result.totalDetected).toBe(2);

    const slugs = result.plugins.map((p) => p.slug);
    expect(slugs).toContain("elementor");
    expect(slugs).toContain("contact-form-7");
  });

  it("resolves known plugin names and categories", () => {
    const html = `<link href="/wp-content/plugins/wordpress-seo/style.css">`;
    const result = parsePluginSignatures(html);
    const yoast = result.plugins.find((p) => p.slug === "wordpress-seo");
    expect(yoast).toBeDefined();
    expect(yoast!.name).toBe("Yoast SEO");
    expect(yoast!.category).toBe("seo");
  });

  it("title-cases unknown plugins as 'other'", () => {
    const html = `<link href="/wp-content/plugins/my-custom-plugin/style.css">`;
    const result = parsePluginSignatures(html);
    const custom = result.plugins.find((p) => p.slug === "my-custom-plugin");
    expect(custom).toBeDefined();
    expect(custom!.name).toBe("My Custom Plugin");
    expect(custom!.category).toBe("other");
  });

  it("detects Elementor via CSS class signature", () => {
    const html = `<div class="elementor-section elementor-top-section">content</div>`;
    const result = parsePluginSignatures(html);
    const el = result.plugins.find((p) => p.slug === "elementor");
    expect(el).toBeDefined();
    expect(el!.category).toBe("page-builder");
  });

  it("detects Yoast via HTML comment signature", () => {
    const html = `<!-- This site is optimized with the Yoast SEO plugin v20.0 -->`;
    const result = parsePluginSignatures(html);
    const yoast = result.plugins.find((p) => p.slug === "wordpress-seo");
    expect(yoast).toBeDefined();
  });

  it("detects Rank Math via meta tag signature", () => {
    const html = `<meta name="rank-math" content="something">`;
    const result = parsePluginSignatures(html);
    const rm = result.plugins.find((p) => p.slug === "seo-by-rank-math");
    expect(rm).toBeDefined();
  });

  it("detects WP Rocket via HTML comment", () => {
    const html = `<!-- This website is like a Rocket, powered by wp-rocket.me -->`;
    const result = parsePluginSignatures(html);
    const rocket = result.plugins.find((p) => p.slug === "wp-rocket");
    expect(rocket).toBeDefined();
    expect(rocket!.category).toBe("cache");
  });

  it("detects Divi via CSS class", () => {
    const html = `<div class="et_pb_section et_pb_fullwidth">content</div>`;
    const result = parsePluginSignatures(html);
    const divi = result.plugins.find((p) => p.slug === "divi-builder");
    expect(divi).toBeDefined();
    expect(divi!.category).toBe("page-builder");
  });

  it("detects WooCommerce via CSS class", () => {
    const html = `<body class="woocommerce-page woocommerce-shop">content</body>`;
    const result = parsePluginSignatures(html);
    const woo = result.plugins.find((p) => p.slug === "woocommerce");
    expect(woo).toBeDefined();
    expect(woo!.category).toBe("ecommerce");
  });

  it("deduplicates — asset path + signature for same plugin counts once", () => {
    const html = `
      <link href="/wp-content/plugins/elementor/style.css">
      <div class="elementor-section">content</div>
    `;
    const result = parsePluginSignatures(html);
    const elementorPlugins = result.plugins.filter((p) => p.slug === "elementor");
    expect(elementorPlugins).toHaveLength(1);
  });

  it("sorts by category order then name", () => {
    const html = `
      <link href="/wp-content/plugins/wordfence/style.css">
      <link href="/wp-content/plugins/elementor/style.css">
      <link href="/wp-content/plugins/wordpress-seo/style.css">
    `;
    const result = parsePluginSignatures(html);
    expect(result.plugins[0].category).toBe("page-builder");
    expect(result.plugins[1].category).toBe("seo");
    expect(result.plugins[2].category).toBe("security");
  });

  it("returns empty result for HTML with no plugins", () => {
    const html = `<html><body><h1>Hello</h1></body></html>`;
    const result = parsePluginSignatures(html);
    expect(result.totalDetected).toBe(0);
    expect(result.plugins).toEqual([]);
  });

  it("handles empty string", () => {
    const result = parsePluginSignatures("");
    expect(result.totalDetected).toBe(0);
  });
});
