"use client";

import { useRef, useState } from "react";
import { FileJson, Upload, X } from "lucide-react";
import { AuditParseError, parseServerAudit, type ServerAudit } from "@/lib/server-audit";

interface AuditUploadProps {
  audit: { file: string; data: ServerAudit } | null;
  siteHome: string | null;
  domainMatches: boolean;
  onLoad: (file: string, data: ServerAudit) => void;
  onClear: () => void;
}

const MAX_BYTES = 10 * 1024 * 1024;

export function AuditUpload({ audit, siteHome, domainMatches, onLoad, onClear }: AuditUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("File is larger than 10 MB.");
      return;
    }
    try {
      const data = parseServerAudit(await file.text());
      onLoad(file.name, data);
    } catch (e) {
      setError(e instanceof AuditParseError ? e.message : "Could not read the file.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (audit) {
    return (
      <section className="pb-4" aria-label="Server-side audit">
        <div className="flex items-center gap-3 bg-[var(--report-surface)] border border-[var(--report-green-dim)] rounded-[var(--radius)] px-5 py-3.5">
          <FileJson className="size-5 shrink-0 text-[var(--report-green)]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-[var(--report-text)] truncate">
              Server audit merged: {audit.file}
            </div>
            <div className="text-[12px] text-[var(--report-text-muted)] font-mono truncate">
              {siteHome ?? "unknown site"} · generated {new Date(audit.data.generated).toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-[12px] text-[var(--report-text-muted)] hover:text-[var(--report-accent)] transition-colors cursor-pointer"
          >
            <X className="size-3.5" aria-hidden="true" />
            Remove
          </button>
        </div>
        {!domainMatches && (
          <p role="alert" className="mt-2 text-[12px] text-[var(--report-yellow)]">
            Heads up: the audit was generated for {siteHome}, which differs from the scanned domain. Numbers may not belong to the same site.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="pb-4" aria-label="Upload server-side audit">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex items-center gap-4 rounded-[var(--radius)] border border-dashed px-5 py-4 transition-colors max-sm:flex-col max-sm:items-start ${
          dragging
            ? "border-[var(--report-accent)] bg-[var(--report-surface-2)]"
            : "border-[var(--border)] bg-[var(--report-surface)]"
        }`}
      >
        <Upload className="size-5 shrink-0 text-[var(--report-accent)]" aria-hidden="true" />
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-[var(--report-text)]">
            Add the server-side audit for a full migration analysis
          </div>
          <p className="text-[13px] text-[var(--report-text-secondary)] leading-relaxed">
            Upload the JSON exported by the Nexity Migration Audit plugin. It adds what a public scan can&apos;t see — drafts, hidden content types, custom blocks, ACF fields, redirects, media and the full plugin list. The file is processed in your browser only.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 h-9 px-4 rounded-lg bg-[var(--report-accent)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          Upload JSON
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Server audit JSON file"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[12px] text-[var(--report-red)]">
          {error}
        </p>
      )}
    </section>
  );
}
