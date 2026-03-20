import { ApifyClient } from "apify-client";
import type { ApifyAgentTask, CrawlOptions } from "../types";

function getApifyClient(tokenOverride?: string) {
  if (!tokenOverride) {
    throw new Error("Apify API token not configured. Please add it in Settings → API Keys.");
  }
  return new ApifyClient({ token: tokenOverride });
}

export async function getCrawlStatus(taskId: string, tokenOverride?: string): Promise<ApifyAgentTask> {
  try {
    const client = getApifyClient(tokenOverride);
    const run = await client.run(taskId).get();

    if (!run) {
      return { task_id: taskId, status: "failed", error: "Apify run not found" };
    }

    const statusMap: Record<string, ApifyAgentTask["status"]> = {
      "READY": "queued",
      "RUNNING": "in_progress",
      "SUCCEEDED": "completed",
      "FAILED": "failed",
      "TIMING-OUT": "failed",
      "ABORTING": "failed",
      "ABORTED": "failed",
    };

    const agentTask: ApifyAgentTask = {
      task_id: taskId,
      status: statusMap[run.status] || "failed",
    };

    if (run.status === "SUCCEEDED" && run.defaultDatasetId) {
      const dataset = await client.dataset(run.defaultDatasetId).listItems();
      agentTask.result = JSON.stringify(dataset.items);
    } else if (run.status === "FAILED") {
      agentTask.error = "Apify actor run failed";
    }

    return agentTask;
  } catch (error) {
    return {
      task_id: taskId,
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to fetch Apify status",
    };
  }
}

export async function crawlMetaAdLibrary(
  query: string,
  options: CrawlOptions = {},
  tokenOverride?: string
): Promise<ApifyAgentTask> {
  const client = getApifyClient(tokenOverride);
  const maxResults = options.maxResults ?? 20;

  const run = await client.actor("dz_omar/facebook-ads-scraper-pro").start({
    searchQueries: [query],
    maxAds: maxResults,
    country: options.country ?? "US",
    proxyConfiguration: {
      useApifyProxy: true,
    },
  });

  return { task_id: run.id, status: "queued" };
}

export async function crawlTikTokTopAds(
  query: string,
  options: CrawlOptions = {},
  tokenOverride?: string
): Promise<ApifyAgentTask> {
  const client = getApifyClient(tokenOverride);
  const maxResults = options.maxResults ?? 20;

  const tiktokAllowedRegions = new Set(["FR","AT","BE","BG","HR","CY","CZ","DK","EE","FI","DE","GR","HU","IS","IE","IT","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI","ES","SE","CH","TR","GB"]);
  const region = options.country && tiktokAllowedRegions.has(options.country) ? options.country : "all";

  const run = await client.actor("zadexinho/tiktok-ads-scraper").start({
    searchQuery: query,
    maxResults: maxResults,
    fetchDetails: true,
    region,
    proxyConfiguration: {
      useApifyProxy: true,
    },
  });

  return { task_id: run.id, status: "queued" };
}

export async function scrapeLandingPage(
  url: string,
  tokenOverride?: string
): Promise<ApifyAgentTask> {
  const client = getApifyClient(tokenOverride);

  const run = await client.actor("apify/website-content-crawler").start({
    startUrls: [{ url }],
    maxCrawlDepth: 0,
    maxCrawlPages: 1,
    crawlerType: "cheerio",
    proxyConfiguration: {
      useApifyProxy: true,
    },
  });

  return { task_id: run.id, status: "queued" };
}
