"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ScanResult } from "@/types";
import { UrlInputForm } from "@/components/url-input-form";
import { ScanProgress } from "@/components/scan-progress";
import { ScanResults } from "@/components/scan-results";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

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

  function handleReset() {
    setState({ phase: "idle" });
    setUrlParam(null);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {state.phase === "idle" && <UrlInputForm onSubmit={handleScan} />}

      {state.phase === "scanning" && <ScanProgress url={state.url} />}

      {state.phase === "results" && (
        <ScanResults data={state.data} onReset={handleReset} />
      )}

      {state.phase === "error" && (
        <div className="w-full max-w-xl space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Scan Failed</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <Button onClick={handleReset} variant="outline" className="w-full">
            Try Again
          </Button>
        </div>
      )}
    </main>
  );
}
