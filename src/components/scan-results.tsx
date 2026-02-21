"use client";

import type { ScanResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ContentTypesTable } from "@/components/content-types-table";
import { DetectedPluginsCard } from "@/components/detected-plugins-card";
import { UrlStructureCard } from "@/components/url-structure-card";
import { ScanWarnings } from "@/components/scan-warnings";

interface ScanResultsProps {
  data: ScanResult;
  onReset: () => void;
}

export function ScanResults({ data, onReset }: ScanResultsProps) {
  const scannedAt = new Date(data.scannedAt).toLocaleString();

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.url}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scanned {scannedAt}
          </p>
        </div>
        <Badge variant={data.apiAvailable ? "default" : "secondary"}>
          {data.apiAvailable ? "REST API" : "Fallback"}
        </Badge>
      </div>

      <Separator />

      {/* Content Types */}
      <ContentTypesTable contentTypes={data.contentTypes} />

      {/* Detected Plugins */}
      {data.detectedPlugins && data.detectedPlugins.plugins.length > 0 && (
        <DetectedPluginsCard pluginScanResult={data.detectedPlugins} />
      )}

      {/* URL Structure */}
      {data.urlStructure && (
        <UrlStructureCard urlStructure={data.urlStructure} />
      )}

      {/* Warnings */}
      <ScanWarnings errors={data.errors} />

      {/* Reset */}
      <Button onClick={onReset} variant="outline" className="w-full">
        Scan Another Site
      </Button>
    </div>
  );
}
