import { describe, it, expect } from "vitest";
import { titleCase, decodeHtmlEntities, toErrorMessage } from "./utils";

describe("titleCase", () => {
  it("converts hyphenated slugs", () => {
    expect(titleCase("my-cool-plugin")).toBe("My Cool Plugin");
  });

  it("converts underscored slugs", () => {
    expect(titleCase("my_cool_plugin")).toBe("My Cool Plugin");
  });

  it("handles single word", () => {
    expect(titleCase("blog")).toBe("Blog");
  });

  it("handles mixed separators", () => {
    expect(titleCase("my-cool_plugin")).toBe("My Cool Plugin");
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes &amp;", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry")).toBe("Tom & Jerry");
  });

  it("decodes &#038;", () => {
    expect(decodeHtmlEntities("Tom &#038; Jerry")).toBe("Tom & Jerry");
  });

  it("decodes quotes", () => {
    expect(decodeHtmlEntities("&quot;Hello&quot;")).toBe('"Hello"');
  });

  it("decodes smart quotes", () => {
    expect(decodeHtmlEntities("&#8216;Hello&#8217;")).toBe("\u2018Hello\u2019");
  });

  it("decodes dashes", () => {
    expect(decodeHtmlEntities("2020&#8211;2025")).toBe("2020\u20132025");
    expect(decodeHtmlEntities("wait&#8212;what")).toBe("wait\u2014what");
  });

  it("passes through plain text", () => {
    expect(decodeHtmlEntities("Hello World")).toBe("Hello World");
  });
});

describe("toErrorMessage", () => {
  it("extracts message from Error", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("converts non-Error to string", () => {
    expect(toErrorMessage("something")).toBe("something");
    expect(toErrorMessage(42)).toBe("42");
    expect(toErrorMessage(null)).toBe("null");
  });
});
