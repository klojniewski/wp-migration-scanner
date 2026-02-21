import { Suspense } from "react";
import { ScannerPage } from "@/components/scanner-page";

export default function Home() {
  return (
    <Suspense>
      <ScannerPage />
    </Suspense>
  );
}
