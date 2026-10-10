"use client";

import { useMemo, useState } from "react";
import type { ScanResult, Annotation, AnnotationSection } from "@/types";
import { generateAnnotations } from "@/lib/annotations";
import { generateMigrationScope } from "@/lib/migration-scope";
import { analyzeAudit, generateFullMigrationScope, type ServerAudit } from "@/lib/server-audit";
import { AuditUpload } from "@/components/audit-upload";
import { AuditReportCard } from "@/components/audit-report-card";
import { ReportHeader } from "@/components/report-header";
import { FallbackNotice } from "@/components/fallback-notice";
import { StatsRow } from "@/components/stats-row";
import { MigrationScopeCard } from "@/components/migration-scope-card";
import { ContentTypesTable } from "@/components/content-types-table";
import { ContentRelationshipsCard } from "@/components/content-relationships-card";
import { AnnotationBlock } from "@/components/annotation-block";
import { MultilingualMatrix } from "@/components/multilingual-matrix";
import { DetectedPluginsCard } from "@/components/detected-plugins-card";
import { DetectedIntegrationsCard } from "@/components/detected-integrations-card";
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
  const [audit, setAudit] = useState<{ file: string; data: ServerAudit } | null>(null);
  const annotations = useMemo(() => generateAnnotations(data), [data]);
  const baseScope = useMemo(() => generateMigrationScope(data), [data]);
  const analysis = useMemo(() => (audit ? analyzeAudit(data, audit.data) : null), [data, audit]);
  const scope = useMemo(
    () => (analysis ? generateFullMigrationScope(data, analysis, baseScope) : baseScope),
    [data, analysis, baseScope]
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-[960px] mx-auto px-6">
          <ReportHeader data={data} />
          <FallbackNotice data={data} />
          <StatsRow data={data} />
          <AuditUpload
            audit={audit}
            siteHome={analysis?.siteHome ?? null}
            domainMatches={analysis?.domainMatches ?? true}
            onLoad={(file, auditData) => setAudit({ file, data: auditData })}
            onClear={() => setAudit(null)}
          />
          <MigrationScopeCard scope={scope} fullAnalysis={analysis != null} />
          {analysis && <AuditReportCard analysis={analysis} />}

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

          {/* Third-Party Integrations + annotations */}
          {data.detectedIntegrations && data.detectedIntegrations.integrations.length > 0 && (
            <>
              <DetectedIntegrationsCard integrationScanResult={data.detectedIntegrations} />
              <AnnotationBlock annotations={filterBySection(annotations, "integrations")} />
            </>
          )}

          {/* URL Structure + annotations */}
          {data.urlStructure && (
            <>
              <UrlStructureCard urlStructure={data.urlStructure} baseUrl={data.url} />
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
