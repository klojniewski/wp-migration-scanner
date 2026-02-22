"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
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
  const newUrl = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
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
      setState({
        phase: "error",
        message: "Network error. Please try again.",
      });
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
      const domain = state.data.url
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
      document.title = `${domain} - WordPress Migration Scanner`;
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
          <div className="border border-[var(--report-red-dim)] rounded-lg p-6 bg-card">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-md bg-[var(--report-red-dim)] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[var(--report-red)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  Scan Failed
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {state.message}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="w-full h-10 rounded-md border border-border bg-secondary text-secondary-foreground text-sm font-medium transition-all hover:bg-accent cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
