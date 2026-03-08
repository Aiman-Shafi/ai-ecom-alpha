import { NextRequest, NextResponse } from "next/server";
import { analyzeAd } from "@/lib/analysis/analyzer";
import type { BrandProfile } from "@/shared/types";
import type { ForeplayAd } from "@/shared/types/foreplay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ad, brandProfile, openaiApiKey } = body as {
      ad: ForeplayAd;
      brandProfile: BrandProfile;
      openaiApiKey: string;
    };

    if (!ad || !brandProfile) {
      return NextResponse.json({ error: "ad and brandProfile required" }, { status: 400 });
    }

    if (!openaiApiKey) {
      return NextResponse.json({ error: "openaiApiKey required" }, { status: 400 });
    }

    const analysis = await analyzeAd(ad, brandProfile, openaiApiKey);
    return NextResponse.json({ data: analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
