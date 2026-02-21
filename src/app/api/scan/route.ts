import { NextRequest, NextResponse } from "next/server";
import { scan } from "@/scanner";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Basic URL validation
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!parsed.hostname.includes(".")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const result = await scan(url);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
