"use client";

import { useMemo } from "react";
import type { ScanResult, Annotation, AnnotationSection } from "@/types";
import { generateAnnotations } from "@/lib/annotations";
import { generateMigrationScope } from "@/lib/migration-scope";
import { ReportHeader } from "@/components/report-header";
import { StatsRow } from "@/components/stats-row";
import { MigrationScopeCard } from "@/components/migration-scope-card";
import { ContentTypesTable } from "@/components/content-types-table";
import { ContentRelationshipsCard } from "@/components/content-relationships-card";
import { AnnotationBlock } from "@/components/annotation-block";
import { MultilingualMatrix } from "@/components/multilingual-matrix";
import { DetectedPluginsCard } from "@/components/detected-plugins-card";
import { UrlStructureCard } from "@/components/url-structure-card";
import { ScanWarnings } from "@/components/scan-warnings";
import { ScanLimitations } from "@/components/scan-limitations";
import { ReportCTA } from "@/components/report-cta";
import { ReportFooter } from "@/components/report-footer";

interface ScanResultsProps {
  data: ScanResult;
  onReset: () => void;
}

function filterBySection(annotations: Annotation[], section: AnnotationSection): Annotation[] {
  return annotations.filter((a) => a.section === section);
}

export function ScanResults({ data, onReset }: ScanResultsProps) {
  const annotations = useMemo(() => generateAnnotations(data), [data]);
  const scope = useMemo(() => generateMigrationScope(data), [data]);

  return (
    <div className="min-h-screen">
      <div className="max-w-[960px] mx-auto px-6">
          <ReportHeader data={data} />
          <StatsRow data={data} />
          <MigrationScopeCard scope={scope} />

          {/* Content Structure + annotations */}
          <ContentTypesTable contentTypes={data.contentTypes} />
          <AnnotationBlock annotations={filterBySection(annotations, "content-types")} />

          {/* Content Relationships Diagram */}
          <ContentRelationshipsCard contentTypes={data.contentTypes} />

          {/* Multilingual Matrix + annotations (conditional) */}
          {data.urlStructure?.multilingual && (
            <>
              <MultilingualMatrix data={data} />
              <AnnotationBlock annotations={filterBySection(annotations, "multilingual")} />
            </>
          )}

          {/* Detected Plugins + annotations */}
          {data.detectedPlugins && data.detectedPlugins.plugins.length > 0 && (
            <>
              <DetectedPluginsCard pluginScanResult={data.detectedPlugins} />
              <AnnotationBlock annotations={filterBySection(annotations, "plugins")} />
            </>
          )}

          {/* URL Structure + annotations */}
          {data.urlStructure && (
            <>
              <UrlStructureCard urlStructure={data.urlStructure} />
              <AnnotationBlock annotations={filterBySection(annotations, "url-structure")} />
            </>
          )}

          {/* Warnings + annotations */}
          <ScanWarnings errors={data.errors} />
          <AnnotationBlock annotations={filterBySection(annotations, "warnings")} />

          <ScanLimitations />
          <ReportCTA />

          {/* Scan Another Site link */}
          <div className="pb-4 text-center">
            <button
              onClick={onReset}
              className="text-[13px] text-[var(--report-text-muted)] hover:text-[var(--report-accent)] transition-colors underline underline-offset-4 cursor-pointer bg-transparent border-none"
            >
              ← Scan Another Site
            </button>
          </div>

          <ReportFooter scannedAt={data.scannedAt} />
      </div>
    </div>
  );
}
