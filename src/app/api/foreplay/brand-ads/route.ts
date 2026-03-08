import { NextRequest, NextResponse } from "next/server";
import { getAdsByBrandId } from "@/lib/foreplay/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const brandIds = params.getAll("brand_ids");

  if (!brandIds.length) {
    return NextResponse.json({ error: "brand_ids required" }, { status: 400 });
  }

  try {
    const result = await getAdsByBrandId({
      brand_ids: brandIds,
      live: params.get("live") === "true" ? true : undefined,
      display_format: params.getAll("display_format").length
        ? params.getAll("display_format")
        : ["image"],
      running_duration_min_days: params.get("running_duration_min_days")
        ? Number(params.get("running_duration_min_days"))
        : undefined,
      order: (params.get("order") as "newest" | "oldest" | "longest_running" | "most_relevant") || "newest",
      limit: params.get("limit") ? Number(params.get("limit")) : 50,
      cursor: params.get("cursor") ? Number(params.get("cursor")) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
