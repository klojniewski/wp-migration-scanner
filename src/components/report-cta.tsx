"use client";

import { ArrowRight } from "lucide-react";

export function ReportCTA() {
  return (
    <section className="py-10 text-center">
      <div className="border border-border rounded-lg p-10 bg-card">
        <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
          Ready to plan your migration?
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Get a full technical audit and migration blueprint with timeline,
          effort estimate, and content model recommendation.
        </p>
        <a
          href="https://pagepro.co/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 py-2.5 px-6 bg-foreground text-background text-sm font-medium rounded-md no-underline transition-all hover:bg-foreground/90"
        >
          Book Free Consultation
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
