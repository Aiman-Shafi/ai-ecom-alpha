import type { LandingPageIntel } from "../types";

const EXTRACTION_PROMPT = `Extract structured marketing intelligence from this landing page content. Return ONLY valid JSON (no markdown, no code fences) with this structure:
{
  "headline": "<main headline or H1>",
  "subheadline": "<subheadline or H2 if present>",
  "cta": "<primary call-to-action text>",
  "offers": ["<offer 1>", "<offer 2>"],
  "socialProof": ["<proof element 1>", "<proof element 2>"],
  "pricePoints": ["<price 1>", "<price 2>"]
}

Rules:
- "offers" includes discounts, bundles, free shipping, guarantees, bonuses
- "socialProof" includes testimonials, review counts, star ratings, "as seen in", user counts, certifications
- "pricePoints" includes any visible prices, price ranges, or payment plans
- If a field has no data, use an empty string or empty array
- Keep values concise — extract the text, don't paraphrase

Landing page content:
`;

export async function extractLandingPageIntel(
  rawText: string,
  url: string,
  apiKey: string,
  provider: "openai" | "openrouter" = "openai"
): Promise<LandingPageIntel> {
  const truncatedText = rawText.slice(0, 8000);

  try {
    const content = await callLLM(truncatedText, apiKey, provider);
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      url,
      headline: parsed.headline || "",
      subheadline: parsed.subheadline || undefined,
      cta: parsed.cta || "",
      offers: Array.isArray(parsed.offers) ? parsed.offers : [],
      socialProof: Array.isArray(parsed.socialProof) ? parsed.socialProof : [],
      pricePoints: Array.isArray(parsed.pricePoints) ? parsed.pricePoints : [],
    };
  } catch {
    return {
      url,
      headline: "",
      cta: "",
      offers: [],
      socialProof: [],
      pricePoints: [],
      rawContent: truncatedText,
    };
  }
}

async function callLLM(
  text: string,
  apiKey: string,
  provider: "openai" | "openrouter"
): Promise<string> {
  const prompt = EXTRACTION_PROMPT + text;

  if (provider === "openrouter") {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
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
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
