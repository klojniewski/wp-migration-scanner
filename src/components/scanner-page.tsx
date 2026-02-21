"use client";

import { useState } from "react";
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

export function ScannerPage() {
  const [state, setState] = useState<State>({ phase: "idle" });

  async function handleScan(url: string) {
    setState({ phase: "scanning", url });

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
  }

  function handleReset() {
    setState({ phase: "idle" });
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
