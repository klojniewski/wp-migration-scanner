"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
    // Progress: ramp from 0 to 90 over ~60s, then hold
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        // Slow down as we approach 90
        const increment = prev < 30 ? 2 : prev < 60 ? 1.5 : 0.5;
        return Math.min(90, prev + increment);
      });
    }, 1000);

    // Rotate status messages every 4 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Scanning {url}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-center animate-pulse">
          {STATUS_MESSAGES[messageIndex]}
        </p>
      </CardContent>
    </Card>
  );
}
