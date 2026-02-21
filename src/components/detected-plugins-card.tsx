"use client";

import type { PluginCategory, PluginScanResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CATEGORY_LABELS: Record<PluginCategory, string> = {
  "page-builder": "Page Builders",
  seo: "SEO",
  forms: "Forms",
  ecommerce: "E-Commerce",
  multilingual: "Multilingual",
  cache: "Cache / Performance",
  analytics: "Analytics",
  security: "Security",
  other: "Other",
};

interface DetectedPluginsCardProps {
  pluginScanResult: PluginScanResult;
}

export function DetectedPluginsCard({ pluginScanResult }: DetectedPluginsCardProps) {
  const { plugins, totalDetected } = pluginScanResult;

  // Group by category
  const groups = new Map<PluginCategory, typeof plugins>();
  for (const p of plugins) {
    const list = groups.get(p.category) || [];
    list.push(p);
    groups.set(p.category, list);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Plugins</CardTitle>
        <CardDescription>
          {totalDetected} {totalDetected === 1 ? "plugin" : "plugins"} detected from HTML source
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from(groups.entries()).map(([category, categoryPlugins]) => (
          <div key={category}>
            <h4 className="text-sm font-medium mb-2">
              {CATEGORY_LABELS[category]}
              {category === "page-builder" && (
                <span className="ml-1 text-amber-500">★</span>
              )}
            </h4>
            <div className="flex flex-wrap gap-2">
              {categoryPlugins.map((p) => (
                <Badge
                  key={p.slug}
                  variant={category === "page-builder" ? "default" : "secondary"}
                >
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
