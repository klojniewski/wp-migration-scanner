"use client";

import type { UrlStructure } from "@/types";
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

interface UrlStructureCardProps {
  urlStructure: UrlStructure;
}

export function UrlStructureCard({ urlStructure }: UrlStructureCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>URL Structure</CardTitle>
        <CardDescription>
          {urlStructure.totalIndexedUrls.toLocaleString()} indexed URLs analyzed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {urlStructure.patterns.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pattern</TableHead>
                <TableHead>Example</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urlStructure.patterns.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">
                    {p.pattern}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[250px]">
                    {p.example}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.count.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {urlStructure.multilingual && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm font-medium">Multilingual:</span>
            <Badge variant="outline">{urlStructure.multilingual.type}</Badge>
            <div className="flex gap-1">
              {urlStructure.multilingual.languages.map((lang) => (
                <Badge key={lang} variant="secondary">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
