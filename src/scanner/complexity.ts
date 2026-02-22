import type { ContentComplexity } from "../types";

interface BuilderSignature {
  name: string;
  test: (html: string) => boolean;
}

const BUILDER_SIGNATURES: BuilderSignature[] = [
  {
    name: "Elementor",
    test: (html) => /class="[^"]*elementor[-\s]/.test(html) || html.includes("elementor-kit-"),
  },
  {
    name: "WPBakery",
    test: (html) => /class="[^"]*vc_row/.test(html) || /class="[^"]*wpb_/.test(html),
  },
  {
    name: "Divi Builder",
    test: (html) => /class="[^"]*et_pb_/.test(html) || /id="et-boc"/.test(html),
  },
  {
    name: "Beaver Builder",
    test: (html) => /class="[^"]*fl-row/.test(html) || /class="[^"]*fl-builder/.test(html),
  },
  {
    name: "Oxygen",
    test: (html) => /class="[^"]*ct-section/.test(html) || /class="[^"]*oxy-/.test(html),
  },
  {
    name: "Brizy",
    test: (html) => /class="[^"]*brz-/.test(html),
  },
];

interface ModerateSignature {
  name: string;
  test: (html: string) => boolean;
}

const MODERATE_SIGNATURES: ModerateSignature[] = [
  {
    name: "ACF Blocks",
    test: (html) => html.includes("<!-- wp:acf/"),
  },
  {
    name: "Advanced Gutenberg layout",
    test: (html) =>
      /<!-- wp:(columns|group|cover|media-text|table)[ />]/.test(html),
  },
  {
    name: "Shortcodes",
    test: (html) => /\[[a-z_-]+[^\]]*\]/.test(html),
  },
];

export interface WpContentItem {
  contentHtml: string;
  hasCustomFields: boolean;
}

/** Pure function — classifies content complexity from sample post data */
export function analyzeContentComplexity(
  items: WpContentItem[],
): ContentComplexity {
  if (items.length === 0) {
    return { level: "simple", signals: [], builder: null };
  }

  const signals: string[] = [];
  let builder: string | null = null;

  // Check all samples for builder signatures
  for (const sig of BUILDER_SIGNATURES) {
    if (items.some((item) => sig.test(item.contentHtml))) {
      builder = sig.name;
      signals.push(sig.name);
      break; // One builder is enough to classify as complex
    }
  }

  // Check for moderate signals
  for (const sig of MODERATE_SIGNATURES) {
    if (items.some((item) => sig.test(item.contentHtml))) {
      signals.push(sig.name);
    }
  }

  // Check for custom fields (ACF or meta)
  if (items.some((item) => item.hasCustomFields)) {
    signals.push("Custom fields");
  }

  // Classify
  if (builder) {
    return { level: "complex", signals, builder };
  }

  if (signals.length > 0) {
    return { level: "moderate", signals, builder: null };
  }

  return { level: "simple", signals: ["Standard content"], builder: null };
}
