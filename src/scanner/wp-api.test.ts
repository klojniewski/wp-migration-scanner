import { describe, it, expect } from "vitest";
import {
  parseTypesResponse,
  parseTaxonomiesResponse,
  parseContentItems,
  type WpType,
  type WpTaxonomy,
} from "./wp-api";

describe("parseTypesResponse", () => {
  it("returns user-facing content types", () => {
    const json: Record<string, WpType> = {
      post: { name: "Posts", slug: "post", rest_base: "posts", taxonomies: ["category", "post_tag"] },
      page: { name: "Pages", slug: "page", rest_base: "pages", taxonomies: [] },
    };
    const types = parseTypesResponse(json);
    expect(types).toHaveLength(2);
    expect(types.map((t) => t.slug)).toEqual(["post", "page"]);
  });

  it("filters out internal WordPress types", () => {
    const json: Record<string, WpType> = {
      post: { name: "Posts", slug: "post", rest_base: "posts", taxonomies: [] },
      attachment: { name: "Media", slug: "attachment", rest_base: "media", taxonomies: [] },
      nav_menu_item: { name: "Nav Menu Items", slug: "nav_menu_item", rest_base: "menu-items", taxonomies: [] },
      wp_block: { name: "Reusable Blocks", slug: "wp_block", rest_base: "blocks", taxonomies: [] },
      wp_template: { name: "Templates", slug: "wp_template", rest_base: "templates", taxonomies: [] },
      wp_navigation: { name: "Navigation", slug: "wp_navigation", rest_base: "navigation", taxonomies: [] },
      elementor_library: { name: "Elementor Library", slug: "elementor_library", rest_base: "elementor-library", taxonomies: [] },
    };
    const types = parseTypesResponse(json);
    expect(types).toHaveLength(1);
    expect(types[0].slug).toBe("post");
  });

  it("returns empty array for all-internal types", () => {
    const json: Record<string, WpType> = {
      attachment: { name: "Media", slug: "attachment", rest_base: "media", taxonomies: [] },
    };
    expect(parseTypesResponse(json)).toEqual([]);
  });
});

describe("parseTaxonomiesResponse", () => {
  it("returns user-facing taxonomies", () => {
    const json: Record<string, WpTaxonomy> = {
      category: { name: "Categories", slug: "category", rest_base: "categories", types: ["post"] },
      post_tag: { name: "Tags", slug: "post_tag", rest_base: "tags", types: ["post"] },
    };
    const taxes = parseTaxonomiesResponse(json);
    expect(taxes).toHaveLength(2);
    expect(taxes.map((t) => t.slug)).toEqual(["category", "post_tag"]);
  });

  it("filters out internal taxonomies", () => {
    const json: Record<string, WpTaxonomy> = {
      category: { name: "Categories", slug: "category", rest_base: "categories", types: ["post"] },
      nav_menu: { name: "Menus", slug: "nav_menu", rest_base: "menus", types: [] },
      post_format: { name: "Formats", slug: "post_format", rest_base: "formats", types: [] },
      wp_pattern_category: { name: "Patterns", slug: "wp_pattern_category", rest_base: "patterns", types: [] },
    };
    const taxes = parseTaxonomiesResponse(json);
    expect(taxes).toHaveLength(1);
    expect(taxes[0].slug).toBe("category");
  });
});

describe("parseContentItems", () => {
  it("extracts count from header and sample titles", () => {
    const json = [
      { title: { rendered: "Hello World" } },
      { title: { rendered: "Second Post" } },
    ];
    const { count, samples } = parseContentItems(json, "42");
    expect(count).toBe(42);
    expect(samples).toEqual(["Hello World", "Second Post"]);
  });

  it("decodes HTML entities in titles", () => {
    const json = [
      { title: { rendered: "Tom &amp; Jerry" } },
      { title: { rendered: "&quot;Quoted&quot;" } },
    ];
    const { samples } = parseContentItems(json, "2");
    expect(samples[0]).toBe("Tom & Jerry");
    expect(samples[1]).toBe('"Quoted"');
  });

  it("limits samples to 5", () => {
    const json = Array.from({ length: 10 }, (_, i) => ({
      title: { rendered: `Post ${i}` },
    }));
    const { samples } = parseContentItems(json, "10");
    expect(samples).toHaveLength(5);
  });

  it("handles null total header", () => {
    const { count } = parseContentItems([], null);
    expect(count).toBe(0);
  });

  it("filters out empty titles", () => {
    const json = [
      { title: { rendered: "Good Title" } },
      { title: { rendered: "" } },
      { title: { rendered: "Another Good" } },
    ];
    const { samples } = parseContentItems(json, "3");
    expect(samples).toEqual(["Good Title", "Another Good"]);
  });
});
