"use client";

import type { Annotation, AnnotationSeverity } from "@/types";

interface AnnotationBlockProps {
  annotations: Annotation[];
}

const SEVERITY_BORDER: Record<AnnotationSeverity, string> = {
  info: "var(--report-blue)",
  warning: "var(--report-yellow)",
  critical: "var(--report-red)",
};

export function AnnotationBlock({ annotations }: AnnotationBlockProps) {
  if (annotations.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-4">
      {annotations.map((annotation, i) => (
        <div
          key={i}
          className="flex gap-2.5 py-3 px-4 bg-[var(--report-surface-2)] rounded-r-[var(--radius-sm)] text-[13px] text-[var(--report-text-secondary)] leading-relaxed"
          style={{ borderLeft: `3px solid ${SEVERITY_BORDER[annotation.severity]}` }}
        >
          <span className="shrink-0 text-[14px] mt-px">💡</span>
          <div>
            <strong className="text-[var(--report-text)]">{annotation.title}</strong>
            {" — "}
            {annotation.body}
          </div>
        </div>
      ))}
    </div>
  );
}
