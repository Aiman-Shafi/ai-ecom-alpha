import type { ForeplayAd } from "@/shared/types/foreplay";
import type { AdAnalysis } from "@/shared/types";
import type { LandingPageIntel } from "../types";
import type {
  TeardownRequest,
  TeardownProgress,
  TeardownStepStatus,
  TeardownReport,
  TeardownAdEntry,
  TeardownLandingPageEntry,
} from "../types";
import { setTeardown, updateProgress, updateStep, setReport } from "./teardown-store";
import { discoverBrands, getAdsByBrandId } from "@/lib/foreplay/client";
import {
  crawlMetaAdLibrary,
  crawlTikTokTopAds,
  getCrawlStatus,
  scrapeLandingPage,
} from "./apify-client";
import { parseScrapedAds, scrapedAdToForeplayAd } from "./parsers";
import { analyzeAd } from "@/lib/analysis/analyzer";
import { analyzeVideoAd } from "@/lib/video/analysis";
import { extractLandingPageIntel } from "./extract-landing-page";
import { synthesizeReport } from "./synthesize-report";

const APIFY_POLL_INTERVAL = 2000;
const APIFY_POLL_TIMEOUT = 120_000;

function makeInitialProgress(id: string, competitorName: string): TeardownProgress {
  const steps: TeardownStepStatus[] = [
    { phase: "resolving", label: "Resolve Competitor", status: "pending" },
    { phase: "discovering", label: "Discover Ads", status: "pending" },
    { phase: "selecting", label: "Select Top Performers", status: "pending" },
    { phase: "analyzing", label: "Analyze Ads", status: "pending" },
    { phase: "scraping_pages", label: "Scrape Landing Pages", status: "pending" },
    { phase: "synthesizing", label: "Generate Report", status: "pending" },
  ];
  return {
    id,
    competitorName,
    overallStatus: "running",
    steps,
    currentPhase: "resolving",
    startedAt: new Date().toISOString(),
  };
}

async function pollApifyTask(
  taskId: string,
  token?: string
): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < APIFY_POLL_TIMEOUT) {
    const status = await getCrawlStatus(taskId, token);
    if (status.status === "completed") return status.result || null;
    if (status.status === "failed") throw new Error(status.error || "Apify task failed");
    await new Promise((r) => setTimeout(r, APIFY_POLL_INTERVAL));
  }
  throw new Error("Apify task timed out after 120s");
}

export async function runTeardown(id: string, request: TeardownRequest): Promise<void> {
  const progress = makeInitialProgress(id, request.competitorName);
  setTeardown(id, { progress });

  try {
    // === Phase 1: Resolve Brand ===
    updateStep(id, "resolving", { status: "running", startedAt: new Date().toISOString() });
    updateProgress(id, { currentPhase: "resolving" });

    let brandId = request.foreplayBrandId;
    let resolvedBrand: TeardownProgress["resolvedBrand"];

    if (!brandId && request.sources.includes("foreplay") && request.apiKeys.foreplayKey) {
      try {
        const brands = await discoverBrands(
          { query: request.competitorName, limit: 5 },
          request.apiKeys.foreplayKey
        );
        if (brands.data.length > 0) {
          const match = brands.data[0];
          brandId = match.id;
          resolvedBrand = {
            id: match.id,
            name: match.name,
            domain: match.domain,
            avatar: match.avatar,
          };
        }
      } catch {
        // Foreplay brand resolution failed — continue with Apify-only sources
      }
    } else if (brandId) {
      resolvedBrand = { id: brandId, name: request.competitorName, domain: "", avatar: null };
    }

    updateStep(id, "resolving", {
      status: "completed",
      completedAt: new Date().toISOString(),
      detail: resolvedBrand ? `Found: ${resolvedBrand.name}` : "No Foreplay match — using Apify sources",
    });
    updateProgress(id, { resolvedBrand });

    // === Phase 2: Discover Ads ===
    updateStep(id, "discovering", { status: "running", startedAt: new Date().toISOString() });
    updateProgress(id, { currentPhase: "discovering" });

    const allAds: ForeplayAd[] = [];

    // Foreplay path (fast)
    if (brandId && request.sources.includes("foreplay") && request.apiKeys.foreplayKey) {
      try {
        updateStep(id, "discovering", { detail: "Fetching ads from Foreplay..." });
        const result = await getAdsByBrandId(
          {
            brand_ids: [brandId],
            order: "longest_running",
            limit: 50,
            display_format: ["image", "video"],
          },
          request.apiKeys.foreplayKey
        );
        allAds.push(...result.data);
      } catch {
        // Foreplay fetch failed — continue with other sources
      }
    }

    // Apify paths (slow, run in parallel)
    const apifyPromises: Promise<void>[] = [];

    if (request.sources.includes("meta_apify") && request.apiKeys.apifyToken) {
      apifyPromises.push(
        (async () => {
          try {
            updateStep(id, "discovering", { detail: "Crawling Meta Ad Library..." });
            const task = await crawlMetaAdLibrary(
              request.competitorName,
              { maxResults: 30 },
              request.apiKeys.apifyToken
            );
            const raw = await pollApifyTask(task.task_id, request.apiKeys.apifyToken);
            if (raw) {
              const scraped = parseScrapedAds(raw, task.task_id, "meta");
              allAds.push(...scraped.map(scrapedAdToForeplayAd));
            }
          } catch {
            // Meta crawl failed — continue
          }
        })()
      );
    }

    if (request.sources.includes("tiktok_apify") && request.apiKeys.apifyToken) {
      apifyPromises.push(
        (async () => {
          try {
            updateStep(id, "discovering", { detail: "Crawling TikTok Top Ads..." });
            const task = await crawlTikTokTopAds(
              request.competitorName,
              { maxResults: 30 },
              request.apiKeys.apifyToken
            );
            const raw = await pollApifyTask(task.task_id, request.apiKeys.apifyToken);
            if (raw) {
              const scraped = parseScrapedAds(raw, task.task_id, "tiktok");
              allAds.push(...scraped.map(scrapedAdToForeplayAd));
            }
          } catch {
            // TikTok crawl failed — continue
          }
        })()
      );
    }

    if (apifyPromises.length > 0) {
      await Promise.allSettled(apifyPromises);
    }

    if (allAds.length === 0) {
      throw new Error(`No ads found for "${request.competitorName}" across any source.`);
    }

    // Deduplicate by ad description + advertiser name
    const seen = new Set<string>();
    const uniqueAds = allAds.filter((ad) => {
      const key = `${ad.name}::${(ad.description || "").slice(0, 100)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    updateStep(id, "discovering", {
      status: "completed",
      completedAt: new Date().toISOString(),
      detail: `Found ${uniqueAds.length} unique ads`,
    });
    updateProgress(id, { discoveredAdsCount: uniqueAds.length });

    // === Phase 3: Rank & Select ===
    updateStep(id, "selecting", { status: "running", startedAt: new Date().toISOString() });
    updateProgress(id, { currentPhase: "selecting" });

    // Sort by running duration descending
    uniqueAds.sort((a, b) => (b.running_duration?.days ?? 0) - (a.running_duration?.days ?? 0));

    // Select top N, preferring a mix of image and video
    const maxAds = request.maxAdsToAnalyze;
    const images = uniqueAds.filter((a) => a.display_format !== "video");
    const videos = uniqueAds.filter((a) => a.display_format === "video");

    const selected: ForeplayAd[] = [];
    let imgIdx = 0;
    let vidIdx = 0;
    while (selected.length < maxAds && (imgIdx < images.length || vidIdx < videos.length)) {
      if (imgIdx < images.length) selected.push(images[imgIdx++]);
      if (selected.length < maxAds && vidIdx < videos.length) selected.push(videos[vidIdx++]);
    }

    // Only keep ads that have media to analyze
    const analyzable = selected.filter((ad) => ad.image || ad.thumbnail || ad.video);

    // Collect unique landing page URLs
    const landingPageUrls = [
      ...new Set(
        analyzable
          .map((ad) => ad.link_url)
          .filter((url): url is string => !!url && url.startsWith("http"))
      ),
    ].slice(0, 5);

    updateStep(id, "selecting", {
      status: "completed",
      completedAt: new Date().toISOString(),
      detail: `Selected ${analyzable.length} ads, ${landingPageUrls.length} landing pages`,
    });
    updateProgress(id, { selectedAdsCount: analyzable.length });

    // === Phase 4: Analyze Ads + Scrape Landing Pages (in parallel) ===
    updateStep(id, "analyzing", { status: "running", startedAt: new Date().toISOString() });
    updateStep(id, "scraping_pages", { status: "running", startedAt: new Date().toISOString() });
    updateProgress(id, { currentPhase: "analyzing" });

    // 4a: Analyze ads sequentially
    const adEntries: TeardownAdEntry[] = [];
    const analyzeAdsWork = (async () => {
      for (let i = 0; i < analyzable.length; i++) {
        const ad = analyzable[i];
        updateStep(id, "analyzing", { detail: `Analyzing ad ${i + 1} of ${analyzable.length}` });

        let analysis: AdAnalysis | null = null;
        let analysisError: string | undefined;

        try {
          const isVideo = ad.display_format === "video" && ad.video;
          if (isVideo && request.apiKeys.googleAiKey) {
            analysis = await analyzeVideoAd(ad, request.brandProfile, request.apiKeys.googleAiKey);
          } else {
            const providerKey = getAnalysisKey(request);
            if (providerKey) {
              analysis = await analyzeAd(
                ad,
                request.brandProfile,
                providerKey,
                request.apiKeys.analysisProvider
              );
            } else {
              analysisError = "No API key configured for analysis";
            }
          }
        } catch (err) {
          analysisError = err instanceof Error ? err.message : "Analysis failed";
        }

        adEntries.push({ ad, analysis, analysisError, rank: i + 1 });
      }
    })();

    // 4b: Scrape landing pages in parallel (up to 3 concurrent)
    const landingPageEntries: TeardownLandingPageEntry[] = [];
    const scrapePagesWork = (async () => {
      if (!request.apiKeys.apifyToken || landingPageUrls.length === 0) {
        updateStep(id, "scraping_pages", {
          status: "skipped",
          completedAt: new Date().toISOString(),
          detail: landingPageUrls.length === 0 ? "No landing pages found" : "No Apify token",
        });
        return;
      }

      updateStep(id, "scraping_pages", {
        detail: `Scraping ${landingPageUrls.length} landing pages...`,
      });

      const concurrency = 3;
      for (let i = 0; i < landingPageUrls.length; i += concurrency) {
        const batch = landingPageUrls.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          batch.map(async (url) => {
            const linkedAdIds = analyzable
              .filter((ad) => ad.link_url === url)
              .map((ad) => ad.id);

            try {
              const task = await scrapeLandingPage(url, request.apiKeys.apifyToken);
              const raw = await pollApifyTask(task.task_id, request.apiKeys.apifyToken);

              let intel: LandingPageIntel | null = null;
              if (raw) {
                const items = JSON.parse(raw);
                const pageText = Array.isArray(items) && items[0]?.text
                  ? items[0].text
                  : typeof items === "string" ? items : JSON.stringify(items);

                const extractionKey = request.apiKeys.openaiKey || request.apiKeys.openrouterKey;
                if (extractionKey) {
                  const provider = request.apiKeys.openaiKey ? "openai" as const : "openrouter" as const;
                  intel = await extractLandingPageIntel(pageText, url, extractionKey, provider);
                }
              }

              return { url, intel, linkedAdIds } satisfies TeardownLandingPageEntry;
            } catch (err) {
              return {
                url,
                intel: null,
                scrapeError: err instanceof Error ? err.message : "Scrape failed",
                linkedAdIds,
              } satisfies TeardownLandingPageEntry;
            }
          })
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            landingPageEntries.push(result.value);
          }
        }
      }
    })();

    // Run both in parallel
    await Promise.allSettled([analyzeAdsWork, scrapePagesWork]);

    const analyzedCount = adEntries.filter((e) => e.analysis).length;
    updateStep(id, "analyzing", {
      status: "completed",
      completedAt: new Date().toISOString(),
      detail: `Analyzed ${analyzedCount} of ${analyzable.length} ads`,
    });
    updateProgress(id, { analyzedAdsCount: analyzedCount });

    if (landingPageEntries.length > 0) {
      const scrapedCount = landingPageEntries.filter((e) => e.intel).length;
      updateStep(id, "scraping_pages", {
        status: "completed",
        completedAt: new Date().toISOString(),
        detail: `Scraped ${scrapedCount} of ${landingPageUrls.length} pages`,
      });
      updateProgress(id, { scrapedPagesCount: scrapedCount });
    }

    // === Phase 5: Synthesize Report ===
    updateStep(id, "synthesizing", { status: "running", startedAt: new Date().toISOString() });
    updateProgress(id, { currentPhase: "synthesizing" });

    const { key: synthesisKey, provider: synthesisProvider } = getSynthesisKeyAndProvider(request);
    if (!synthesisKey) {
      throw new Error("No API key available for report synthesis");
    }

    const synthesis = await synthesizeReport(
      request.competitorName,
      request.brandProfile,
      adEntries,
      landingPageEntries,
      synthesisKey,
      synthesisProvider
    );

    // Compute summary stats
    const allPlatforms = [...new Set(analyzable.flatMap((ad) => ad.publisher_platform))];
    const durations = analyzable.map((ad) => ad.running_duration?.days ?? 0);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const report: TeardownReport = {
      id,
      generatedAt: new Date().toISOString(),
      competitor: {
        name: request.competitorName,
        url: request.competitorUrl,
        foreplayBrandId: brandId,
        avatar: resolvedBrand?.avatar,
      },
      adsSummary: {
        totalDiscovered: uniqueAds.length,
        totalAnalyzed: analyzedCount,
        platforms: allPlatforms,
        avgRunningDays: avgDuration,
        longestRunningDays: durations[0] ?? 0,
        formatBreakdown: {
          image: analyzable.filter((a) => a.display_format !== "video").length,
          video: analyzable.filter((a) => a.display_format === "video").length,
        },
      },
      topAds: adEntries,
      landingPages: landingPageEntries,
      synthesis,
    };

    setReport(id, report);

    updateStep(id, "synthesizing", {
      status: "completed",
      completedAt: new Date().toISOString(),
      detail: "Report ready",
    });
    updateProgress(id, {
      overallStatus: "completed",
      currentPhase: "completed",
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Teardown failed";
    updateProgress(id, {
      overallStatus: "failed",
      currentPhase: "failed",
      completedAt: new Date().toISOString(),
    });
    // Mark any running steps as failed
    const state = (await import("./teardown-store")).getTeardown(id);
    if (state) {
      for (const step of state.progress.steps) {
        if (step.status === "running") {
          step.status = "failed";
          step.error = message;
          step.completedAt = new Date().toISOString();
        }
      }
    }
  }
}

function getAnalysisKey(request: TeardownRequest): string | undefined {
  const { analysisProvider } = request.apiKeys;
  if (analysisProvider === "openai") return request.apiKeys.openaiKey;
  if (analysisProvider === "claude") return request.apiKeys.claudeKey;
  if (analysisProvider === "openrouter") return request.apiKeys.openrouterKey;
  return request.apiKeys.openaiKey || request.apiKeys.claudeKey || request.apiKeys.openrouterKey;
}

function getSynthesisKeyAndProvider(
  request: TeardownRequest
): { key: string | undefined; provider: "openai" | "claude" | "openrouter" | "google" } {
  // Prefer Google AI if available (free tier friendly), then analysis provider, then fallbacks
  if (request.apiKeys.googleAiKey) {
    return { key: request.apiKeys.googleAiKey, provider: "google" };
  }
  const analysisKey = getAnalysisKey(request);
  if (analysisKey) {
    return { key: analysisKey, provider: request.apiKeys.analysisProvider };
  }
  if (request.apiKeys.openaiKey) return { key: request.apiKeys.openaiKey, provider: "openai" };
  if (request.apiKeys.claudeKey) return { key: request.apiKeys.claudeKey, provider: "claude" };
  if (request.apiKeys.openrouterKey) return { key: request.apiKeys.openrouterKey, provider: "openrouter" };
  return { key: undefined, provider: "openai" };
}
