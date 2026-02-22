"use client";

import type { Annotation, AnnotationSeverity } from "@/types";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";

interface AnnotationBlockProps {
  annotations: Annotation[];
}

const SEVERITY_CONFIG: Record<
  AnnotationSeverity,
  { border: string; Icon: typeof Info }
> = {
  info: { border: "var(--report-blue)", Icon: Info },
  warning: { border: "var(--report-yellow)", Icon: AlertTriangle },
  critical: { border: "var(--report-red)", Icon: AlertCircle },
};

export function AnnotationBlock({ annotations }: AnnotationBlockProps) {
  if (annotations.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-4">
      {annotations.map((annotation, i) => {
        const config = SEVERITY_CONFIG[annotation.severity];
        const Icon = config.Icon;
        return (
          <div
            key={i}
            className="flex gap-2.5 py-3 px-4 bg-card rounded-md text-sm text-muted-foreground leading-relaxed"
            style={{ borderLeft: `2px solid ${config.border}` }}
          >
            <Icon
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: config.border }}
            />
            <div>
              <span className="text-foreground font-medium">
                {annotation.title}
              </span>
              {" - "}
              {annotation.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
