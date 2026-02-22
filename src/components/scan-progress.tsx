"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STATUS_MESSAGES = [
  "Connecting to site...",
  "Probing REST API...",
  "Discovering content types...",
  "Fetching taxonomies...",
  "Parsing sitemap...",
  "Analyzing URL structure...",
  "Detecting multilingual setup...",
  "Counting content items...",
  "Gathering sample content...",
  "Compiling results...",
];

interface ScanProgressProps {
  url: string;
}

export function ScanProgress({ url }: ScanProgressProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        const increment = prev < 30 ? 2 : prev < 60 ? 1.5 : 0.5;
        return Math.min(90, prev + increment);
      });
    }, 1000);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-[var(--report-accent)] rounded-md flex items-center justify-center text-sm font-bold text-foreground">
            P
          </div>
          <span className="text-sm font-medium text-muted-foreground tracking-wide">
            WordPress Migration Scanner
          </span>
        </div>
      </div>

      <div className="border border-border rounded-lg p-8 bg-card">
        <div className="flex items-center justify-center mb-6">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
        <h2 className="text-base font-semibold text-foreground text-center mb-1">
          Scanning {displayUrl}
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-6 font-mono">
          This usually takes 15-30 seconds
        </p>

        {/* Progress bar */}
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center transition-opacity duration-300">
          {STATUS_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
}
