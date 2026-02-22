"use client";

import type { ScanResult } from "@/types";
import { FileText, Layers, Languages, Link2 } from "lucide-react";

interface StatsRowProps {
  data: ScanResult;
}

export function StatsRow({ data }: StatsRowProps) {
  const totalItems = data.contentTypes.reduce((sum, ct) => sum + ct.count, 0);
  const langCount = data.urlStructure?.multilingual?.languages.length ?? 0;
  const indexedUrls = data.urlStructure?.totalIndexedUrls ?? 0;

  const stats = [
    {
      value: data.contentTypes.length,
      label: "Content Types",
      icon: Layers,
    },
    {
      value: totalItems.toLocaleString(),
      label: "Total Items",
      icon: FileText,
    },
    {
      value: langCount > 0 ? langCount : "-",
      label: "Languages",
      icon: Languages,
    },
    {
      value: indexedUrls > 0 ? indexedUrls.toLocaleString() : "-",
      label: "Indexed URLs",
      icon: Link2,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-px rounded-lg border border-border overflow-hidden my-8 max-sm:grid-cols-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-card py-5 px-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold tracking-tight text-foreground max-sm:text-xl font-mono">
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stat.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
