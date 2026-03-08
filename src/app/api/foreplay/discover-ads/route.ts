import { NextRequest, NextResponse } from "next/server";
import { discoverAds } from "@/lib/foreplay/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  try {
    const result = await discoverAds({
      query: params.get("query") || undefined,
      niches: params.getAll("niches").length ? params.getAll("niches") : undefined,
      display_format: params.getAll("display_format").length
        ? params.getAll("display_format")
        : ["image"],
      publisher_platform: params.getAll("publisher_platform").length
        ? params.getAll("publisher_platform")
        : undefined,
      running_duration_min_days: params.get("running_duration_min_days")
        ? Number(params.get("running_duration_min_days"))
        : undefined,
      start_date: params.get("start_date") || undefined,
      end_date: params.get("end_date") || undefined,
      order: (params.get("order") as "newest" | "oldest" | "longest_running" | "most_relevant") || "longest_running",
      limit: params.get("limit") ? Number(params.get("limit")) : 30,
      cursor: params.get("cursor") ? Number(params.get("cursor")) : undefined,
      live: params.get("live") === "true" ? true : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
