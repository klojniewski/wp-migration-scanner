"use client";

import { useState } from "react";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function UrlInputForm({ onSubmit, disabled }: UrlInputFormProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[var(--report-accent)] rounded-[6px] flex items-center justify-center text-[14px] font-bold text-white">
            P
          </div>
          <span className="text-[14px] font-semibold tracking-[0.06em] uppercase text-[var(--report-text-secondary)]">
            WordPress Migration Scanner
          </span>
        </div>
        <h1 className="text-[32px] font-bold tracking-[-0.03em] text-[var(--report-text)] mb-3">
          Scan any WordPress site
        </h1>
        <p className="text-[15px] text-[var(--report-text-secondary)] max-w-md mx-auto leading-relaxed">
          Discover content types, taxonomies, plugins, and URL structure before your migration.
        </p>
      </div>

      <div className="bg-[var(--report-surface)] border border-[var(--border)] rounded-[var(--radius)] p-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
            className="flex-1 h-11 px-4 rounded-lg bg-[var(--report-surface-2)] border border-[var(--border)] text-[var(--report-text)] placeholder:text-[var(--report-text-muted)] text-[15px] outline-none transition-all focus:border-[var(--report-accent)] focus:ring-2 focus:ring-[var(--report-accent-dim)] disabled:opacity-50 font-sans"
          />
          <button
            type="submit"
            disabled={disabled || !url.trim()}
            className="h-11 px-6 rounded-lg bg-[var(--report-accent)] text-white text-[14px] font-semibold transition-all hover:bg-[#d12e31] hover:shadow-[0_4px_20px_var(--report-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Scan
          </button>
        </form>
      </div>

      <p className="text-center text-[12px] text-[var(--report-text-muted)] mt-4">
        No credentials required — scans only publicly accessible data.
      </p>
    </div>
  );
}
