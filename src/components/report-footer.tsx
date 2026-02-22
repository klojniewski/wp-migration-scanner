"use client";

interface ReportFooterProps {
  scannedAt: string;
}

export function ReportFooter({ scannedAt }: ReportFooterProps) {
  const date = new Date(scannedAt);
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <footer className="py-6 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
      <span>
        WordPress Migration Scanner by{" "}
        <a
          href="https://pagepro.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/70 no-underline hover:text-foreground transition-colors"
        >
          Pagepro
        </a>
        {" - Next.js & Sanity Migration Experts"}
      </span>
      <span className="font-mono">Report generated {dateStr}</span>
    </footer>
  );
}
