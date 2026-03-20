import type { BrandProfile, AdAnalysis, ImageAdAnalysis, VideoAdAnalysis } from "@/shared/types";
import type { ForeplayAd } from "@/shared/types/foreplay";
import type { LandingPageIntel } from "../types";
import type { TeardownSynthesis, TeardownAdEntry, TeardownLandingPageEntry } from "../types";

function summarizeAnalysis(ad: ForeplayAd, analysis: AdAnalysis): string {
  const lines: string[] = [];
  lines.push(`Platform: ${ad.publisher_platform.join(", ")} | Format: ${ad.display_format} | Running: ${ad.running_duration.days} days`);
  lines.push(`Score: ${analysis.overallScore}/10`);
  lines.push(`Ad copy: "${(ad.description || "").slice(0, 200)}"`);

  if (analysis.mediaType === "image") {
    const img = analysis as ImageAdAnalysis;
    lines.push(`Hook: "${img.conversionElements.hook.text}" (${img.conversionElements.hook.type})`);
    lines.push(`CTA: "${img.conversionElements.cta.text}" (urgency: ${img.conversionElements.cta.urgencyLevel})`);
    lines.push(`Layout: ${img.conversionElements.visualHierarchy.layoutType}`);
    lines.push(`Social proof: ${img.conversionElements.socialProof.type}`);
    lines.push(`Must-keep: ${img.replicationBrief.mustKeepElements.slice(0, 3).join(", ")}`);
  } else {
    const vid = analysis as VideoAdAnalysis;
    lines.push(`Hook: "${vid.videoSummary.hookSummary}"`);
    lines.push(`CTA: "${vid.videoSummary.ctaText}"`);
    lines.push(`Duration: ${vid.videoSummary.durationLabel}`);
    lines.push(`Audio: ${vid.audioAnalysis.audioStrategy}`);
    lines.push(`Must-keep: ${vid.replicationBrief.mustKeepElements.slice(0, 3).join(", ")}`);
  }

  return lines.join("\n");
}

function summarizeLandingPage(lp: LandingPageIntel): string {
  const lines: string[] = [];
  lines.push(`URL: ${lp.url}`);
  if (lp.headline) lines.push(`Headline: "${lp.headline}"`);
  if (lp.subheadline) lines.push(`Subheadline: "${lp.subheadline}"`);
  if (lp.cta) lines.push(`CTA: "${lp.cta}"`);
  if (lp.offers.length) lines.push(`Offers: ${lp.offers.join("; ")}`);
  if (lp.socialProof.length) lines.push(`Social proof: ${lp.socialProof.join("; ")}`);
  if (lp.pricePoints.length) lines.push(`Prices: ${lp.pricePoints.join("; ")}`);
  return lines.join("\n");
}

function buildSynthesisPrompt(
  competitorName: string,
  brandProfile: BrandProfile,
  adEntries: TeardownAdEntry[],
  landingPages: TeardownLandingPageEntry[]
): string {
  const brandContext = [
    `Brand: ${brandProfile.brandName}`,
    `Niche: ${brandProfile.niche}`,
    `Target audience: ${brandProfile.targetAudience}`,
    `Voice: ${brandProfile.brandVoice}`,
    `USPs: ${brandProfile.usps.join(", ")}`,
    `Price range: ${brandProfile.priceRange}`,
  ].join("\n");

  const adSummaries = adEntries
    .filter((e) => e.analysis)
    .map((e, i) => `### Ad #${i + 1}\n${summarizeAnalysis(e.ad, e.analysis!)}`)
    .join("\n\n");

  const lpSummaries = landingPages
    .filter((e) => e.intel)
    .map((e) => summarizeLandingPage(e.intel!))
    .join("\n\n");

  return `You are a senior e-commerce advertising strategist. Analyze this competitor's advertising strategy and produce actionable intelligence for the brand described below.

## Your Client's Brand
${brandContext}

## Competitor: ${competitorName}

## Competitor's Top Ads (ranked by longevity — longer running = more profitable)
${adSummaries || "No ad analyses available."}

## Competitor's Landing Pages
${lpSummaries || "No landing page data available."}

Based on this data, return ONLY valid JSON (no markdown, no code fences) matching this exact structure:
{
  "executiveSummary": "<2-3 sentence overview of competitor's ad strategy and how the client can respond>",
  "adStrategyBreakdown": {
    "primaryHookTypes": ["<hook type 1>", "<hook type 2>"],
    "dominantFormats": ["<format 1>"],
    "commonCTAs": ["<cta 1>", "<cta 2>"],
    "messagingThemes": ["<theme 1>", "<theme 2>"],
    "visualPatterns": ["<pattern 1>", "<pattern 2>"],
    "audienceAngle": "<who they're targeting and how>"
  },
  "landingPagePatterns": {
    "commonOffers": ["<offer 1>"],
    "pricingStrategy": "<how they price and present prices>",
    "socialProofUsage": "<how they use social proof>",
    "conversionTactics": ["<tactic 1>", "<tactic 2>"]
  },
  "strengthsAndWeaknesses": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>"],
    "gaps": ["<opportunity the client can exploit>"]
  },
  "actionableRecommendations": {
    "quickWins": ["<implement this week>"],
    "strategicMoves": ["<longer-term play>"],
    "adConceptIdeas": ["<specific ad concept to test>"]
  },
  "competitivePositioning": "<how the client should differentiate from this competitor>"
}

Be specific and actionable. Reference the actual ad data. Frame recommendations for the client's brand voice and audience.`;
}

export async function synthesizeReport(
  competitorName: string,
  brandProfile: BrandProfile,
  adEntries: TeardownAdEntry[],
  landingPages: TeardownLandingPageEntry[],
  apiKey: string,
  provider: "openai" | "claude" | "openrouter" | "google" = "openai"
): Promise<TeardownSynthesis> {
  const prompt = buildSynthesisPrompt(competitorName, brandProfile, adEntries, landingPages);
  const content = await callSynthesisLLM(prompt, apiKey, provider);

  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as TeardownSynthesis;
}

async function callSynthesisLLM(
  prompt: string,
  apiKey: string,
  provider: "openai" | "claude" | "openrouter" | "google"
): Promise<string> {
  if (provider === "google") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 3000 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Google AI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  if (provider === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  if (provider === "openrouter") {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  // Default: OpenAI
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
