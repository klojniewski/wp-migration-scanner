"use client";

import type { ContentType } from "@/types";
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
