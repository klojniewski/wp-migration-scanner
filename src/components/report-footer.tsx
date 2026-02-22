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
    <footer className="py-6 border-t border-[var(--border)] flex justify-between items-center text-[12px] text-[var(--report-text-muted)]">
      <span>
        WordPress Migration Scanner by{" "}
        <a
          href="https://pagepro.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--report-text-secondary)] no-underline hover:text-[var(--report-accent)] transition-colors"
        >
          Pagepro
        </a>
        {" — Next.js & Sanity Migration Experts"}
      </span>
      <span>Report generated {dateStr}</span>
    </footer>
  );
}
