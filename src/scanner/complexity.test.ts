import { describe, it, expect } from "vitest";
import { analyzeContentComplexity, type WpContentItem } from "./complexity";

function items(...htmls: string[]): WpContentItem[] {
  return htmls.map((contentHtml) => ({ contentHtml, hasCustomFields: false }));
}

describe("analyzeContentComplexity", () => {
  it("classifies standard HTML as simple", () => {
    const result = analyzeContentComplexity(
      items(
        "<p>Hello world</p>",
        "<h2>Title</h2><p>Some paragraph with a <a href='#'>link</a>.</p>",
      ),
    );
    expect(result.level).toBe("simple");
    expect(result.builder).toBeNull();
    expect(result.signals).toContain("Standard content");
  });

  it("classifies empty content as simple", () => {
    const result = analyzeContentComplexity(items("", ""));
    expect(result.level).toBe("simple");
  });

  it("classifies no items as simple", () => {
    const result = analyzeContentComplexity([]);
    expect(result.level).toBe("simple");
  });

  it("detects Elementor as complex", () => {
    const result = analyzeContentComplexity(
      items('<div class="elementor-section elementor-top-section">content</div>'),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("Elementor");
    expect(result.signals).toContain("Elementor");
  });

  it("detects Elementor via kit marker", () => {
    const result = analyzeContentComplexity(
      items('<link rel="stylesheet" href="elementor-kit-123">'),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("Elementor");
  });

  it("detects WPBakery as complex", () => {
    const result = analyzeContentComplexity(
      items('<div class="vc_row wpb_row"><div class="wpb_column">content</div></div>'),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("WPBakery");
  });

  it("detects Divi as complex", () => {
    const result = analyzeContentComplexity(
      items('<div class="et_pb_section et_pb_fullwidth">content</div>'),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("Divi Builder");
  });

  it("detects Beaver Builder as complex", () => {
    const result = analyzeContentComplexity(
      items('<div class="fl-row fl-row-full-width">content</div>'),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("Beaver Builder");
  });

  it("detects Oxygen as complex", () => {
    const result = analyzeContentComplexity(
      items('<div class="ct-section">content</div>'),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("Oxygen");
  });

  it("detects Brizy as complex", () => {
    const result = analyzeContentComplexity(
      items('<div class="brz-root">content</div>'),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("Brizy");
  });

  it("detects ACF blocks as moderate", () => {
    const result = analyzeContentComplexity(
      items("<!-- wp:acf/hero-banner -->content<!-- /wp:acf/hero-banner -->"),
    );
    expect(result.level).toBe("moderate");
    expect(result.builder).toBeNull();
    expect(result.signals).toContain("ACF Blocks");
  });

  it("detects complex Gutenberg layouts as moderate", () => {
    const result = analyzeContentComplexity(
      items("<!-- wp:columns --><div>columns</div><!-- /wp:columns -->"),
    );
    expect(result.level).toBe("moderate");
    expect(result.signals).toContain("Advanced Gutenberg layout");
  });

  it("detects shortcodes as moderate", () => {
    const result = analyzeContentComplexity(
      items("<p>Before</p>[contact-form id='1']<p>After</p>"),
    );
    expect(result.level).toBe("moderate");
    expect(result.signals).toContain("Shortcodes");
  });

  it("detects custom fields as moderate", () => {
    const result = analyzeContentComplexity([
      { contentHtml: "<p>Simple content</p>", hasCustomFields: true },
    ]);
    expect(result.level).toBe("moderate");
    expect(result.signals).toContain("Custom fields");
  });

  it("builder takes precedence — complex even with moderate signals", () => {
    const result = analyzeContentComplexity(
      items(
        '<!-- wp:acf/hero --><div class="elementor-section">content</div><!-- /wp:acf/hero -->',
      ),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("Elementor");
    expect(result.signals).toContain("ACF Blocks");
  });

  it("detects builder from any sample even if others are simple", () => {
    const result = analyzeContentComplexity(
      items(
        "<p>Simple post</p>",
        "<p>Another simple post</p>",
        '<div class="elementor-section">complex one</div>',
      ),
    );
    expect(result.level).toBe("complex");
    expect(result.builder).toBe("Elementor");
  });

  it("detects wp:group as moderate", () => {
    const result = analyzeContentComplexity(
      items("<!-- wp:group --><div>grouped</div><!-- /wp:group -->"),
    );
    expect(result.level).toBe("moderate");
  });

  it("detects wp:cover as moderate", () => {
    const result = analyzeContentComplexity(
      items("<!-- wp:cover --><div>cover</div><!-- /wp:cover -->"),
    );
    expect(result.level).toBe("moderate");
  });
});
