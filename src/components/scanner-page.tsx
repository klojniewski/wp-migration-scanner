"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ScanResult } from "@/types";
import { UrlInputForm } from "@/components/url-input-form";
import { ScanProgress } from "@/components/scan-progress";
import { ScanResults } from "@/components/scan-results";

type State =
  | { phase: "idle" }
  | { phase: "scanning"; url: string }
  | { phase: "results"; data: ScanResult }
  | { phase: "error"; message: string };

function setUrlParam(url: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (url) {
    params.set("url", url);
  } else {
    params.delete("url");
  }
  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}

export function ScannerPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>({ phase: "idle" });
  const didAutoScan = useRef(false);

  const handleScan = useCallback(async (url: string) => {
    setState({ phase: "scanning", url });
    setUrlParam(url);

    try {
      const res = await fetch(`/api/scan?url=${encodeURIComponent(url)}`);

      const data = await res.json();

      if (!res.ok) {
        setState({ phase: "error", message: data.error || "Scan failed" });
        return;
      }

      setState({ phase: "results", data });
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    }
  }, []);

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam && !didAutoScan.current) {
      didAutoScan.current = true;
      handleScan(urlParam);
    }
  }, [searchParams, handleScan]);

  useEffect(() => {
    if (state.phase === "results") {
      const domain = state.data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
      document.title = `${domain} — WordPress Migration Scanner`;
    } else {
      document.title = "WordPress Migration Scanner";
    }
  }, [state]);

  function handleReset() {
    setState({ phase: "idle" });
    setUrlParam(null);
  }

  if (state.phase === "results") {
    return <ScanResults data={state.data} onReset={handleReset} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {state.phase === "idle" && <UrlInputForm onSubmit={handleScan} />}

      {state.phase === "scanning" && <ScanProgress url={state.url} />}

      {state.phase === "error" && (
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
          <div className="bg-[var(--report-surface)] border border-[var(--report-red-dim)] rounded-[var(--radius)] p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--report-red)] text-lg">⚠</span>
              <h2 className="text-[18px] font-semibold text-[var(--report-text)]">
                Scan Failed
              </h2>
            </div>
            <p className="text-[14px] text-[var(--report-text-secondary)] mb-6">
              {state.message}
            </p>
            <button
              onClick={handleReset}
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--report-surface-2)] text-[var(--report-text-secondary)] text-[14px] font-medium transition-all hover:bg-[var(--report-surface-3)] hover:text-[var(--report-text)] cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
