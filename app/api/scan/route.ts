import { NextRequest, NextResponse } from "next/server";
import { scan } from "@/scanner";
import { isUrlAllowed } from "@/scanner/http";

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();
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
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
