"use client";

import { useEffect, useState } from "react";

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
    <div className="w-full max-w-xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[var(--report-accent)] rounded-[6px] flex items-center justify-center text-[14px] font-bold text-white">
            P
          </div>
          <span className="text-[14px] font-semibold tracking-[0.06em] uppercase text-[var(--report-text-secondary)]">
            WordPress Migration Scanner
          </span>
        </div>
      </div>

      <div className="bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] p-8">
        <h2 className="text-[18px] font-semibold text-[var(--report-text)] text-center mb-1">
          Scanning {displayUrl}
        </h2>
        <p className="text-[13px] text-[var(--report-text-muted)] text-center mb-6 font-mono">
          This usually takes 15–30 seconds
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[var(--report-surface-3)] rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-[var(--report-accent)] rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[13px] text-[var(--report-text-secondary)] text-center animate-pulse">
          {STATUS_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
}
