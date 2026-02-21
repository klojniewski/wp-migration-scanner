import { NextRequest, NextResponse } from "next/server";
import { scan } from "@/scanner";
import { isUrlAllowed } from "@/scanner/http";

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

  // URL validation + SSRF protection
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;
  if (!isUrlAllowed(fullUrl)) {
    return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 });
  }

  try {
    const result = await scan(url);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
