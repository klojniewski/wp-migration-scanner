"use client";

import type { ComplexityLevel, ContentType } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COMPLEXITY_CONFIG: Record<ComplexityLevel, { icon: string; label: string; className: string }> = {
  simple: { icon: "\u{1F7E2}", label: "Simple", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  moderate: { icon: "\u{1F7E1}", label: "Moderate", className: "bg-amber-50 text-amber-700 border-amber-200" },
  complex: { icon: "\u{1F534}", label: "Complex", className: "bg-red-50 text-red-700 border-red-200" },
};

interface ContentTypesTableProps {
  contentTypes: ContentType[];
}

export function ContentTypesTable({ contentTypes }: ContentTypesTableProps) {
  if (contentTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Types</CardTitle>
          <CardDescription>No content types discovered.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalItems = contentTypes.reduce((sum, ct) => sum + ct.count, 0);
  const hasComplexity = contentTypes.some((ct) => ct.complexity != null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Types</CardTitle>
        <CardDescription>
          {contentTypes.length} type{contentTypes.length !== 1 && "s"} found
          &middot; {totalItems.toLocaleString()} total items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Count</TableHead>
              {hasComplexity && <TableHead>Complexity</TableHead>}
              <TableHead>Taxonomies</TableHead>
              <TableHead>Samples</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contentTypes.map((ct) => (
              <TableRow key={ct.slug}>
                <TableCell className="font-medium">
                  {ct.name}
                  {ct.isEstimate && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ~
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {ct.count.toLocaleString()}
                </TableCell>
                {hasComplexity && (
                  <TableCell>
                    {ct.complexity ? (
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${COMPLEXITY_CONFIG[ct.complexity.level].className}`}
                          title={ct.complexity.signals.join(", ")}
                        >
                          {COMPLEXITY_CONFIG[ct.complexity.level].icon}{" "}
                          {ct.complexity.builder || COMPLEXITY_CONFIG[ct.complexity.level].label}
                        </span>
                        {ct.complexity.signals.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {ct.complexity.signals
                              .filter((s) => s !== ct.complexity!.builder)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">&mdash;</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ct.taxonomies.length > 0
                      ? ct.taxonomies.map((tax) => (
                          <Badge key={tax.slug} variant="secondary">
                            {tax.name} ({tax.count})
                          </Badge>
                        ))
                      : <span className="text-muted-foreground text-sm">&mdash;</span>}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {ct.samples.length > 0 ? (
                    <ul className="text-sm text-muted-foreground space-y-0.5">
                      {ct.samples.slice(0, 3).map((s, i) => (
                        <li key={i} className="truncate">
                          {s}
                        </li>
                      ))}
                      {ct.samples.length > 3 && (
                        <li className="text-xs">
                          +{ct.samples.length - 3} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-sm">&mdash;</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
