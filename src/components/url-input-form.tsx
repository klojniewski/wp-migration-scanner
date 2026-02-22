"use client";

import { useState } from "react";
import { ArrowRight, Globe } from "lucide-react";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function UrlInputForm({ onSubmit, disabled }: UrlInputFormProps) {
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-[var(--report-accent)] rounded-md flex items-center justify-center text-sm font-bold text-foreground">
            P
          </div>
          <span className="text-sm font-medium text-muted-foreground tracking-wide">
            WordPress Migration Scanner
          </span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3 text-balance">
          Scan any WordPress site
        </h1>
        <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Discover content types, taxonomies, plugins, and URL structure before
          your migration.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center gap-3 h-12 px-4 rounded-lg border bg-card transition-all ${
            focused
              ? "border-foreground/30 ring-1 ring-foreground/10"
              : "border-border hover:border-foreground/20"
          }`}
        >
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
            disabled={disabled}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-sm outline-none disabled:opacity-50 font-sans"
          />
          <button
            type="submit"
            disabled={disabled || !url.trim()}
            className="shrink-0 h-8 px-4 rounded-md bg-foreground text-background text-sm font-medium transition-all hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
          >
            Scan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      <p className="text-center text-xs text-muted-foreground/60 mt-4">
        No credentials required - scans only publicly accessible data.
      </p>
    </div>
  );
}
