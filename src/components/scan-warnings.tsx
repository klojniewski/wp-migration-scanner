"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ScanWarningsProps {
  errors: string[];
}

export function ScanWarnings({ errors }: ScanWarningsProps) {
  if (errors.length === 0) return null;

  return (
    <Alert>
      <AlertTitle>Warnings</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 space-y-1 text-sm">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
