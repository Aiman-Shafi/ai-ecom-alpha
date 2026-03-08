import type {
  ForeplayBrand,
  ForeplayAd,
  ForeplayPaginatedResponse,
  ForeplayAdResponse,
  DiscoverBrandsParams,
  DiscoverAdsParams,
  BrandAdsParams,
} from "@/types/foreplay";

const BASE_URL = "https://public.api.foreplay.co";

function getApiKey(): string {
  const key = process.env.FOREPLAY_API_KEY;
  if (!key) throw new Error("FOREPLAY_API_KEY is not set");
  return key;
}

function buildParams(params: Record<string, unknown>): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.set(key, String(value));
    }
  }
  return searchParams;
}

async function foreplayFetch<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) {
    const searchParams = buildParams(params);
    url.search = searchParams.toString();
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: getApiKey(),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Foreplay API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// --- Discovery Endpoints ---

export async function discoverBrands(
  params: DiscoverBrandsParams
): Promise<ForeplayPaginatedResponse<ForeplayBrand>> {
  return foreplayFetch("/api/discovery/brands", {
    query: params.query,
    niches: params.niches,
    limit: params.limit ?? 20,
    cursor: params.cursor,
  });
}

export async function discoverAds(
  params: DiscoverAdsParams
): Promise<ForeplayPaginatedResponse<ForeplayAd>> {
  return foreplayFetch("/api/discovery/ads", {
    query: params.query,
    niches: params.niches,
    display_format: params.display_format ?? ["image"],
    publisher_platform: params.publisher_platform,
    running_duration_min_days: params.running_duration_min_days,
    running_duration_max_days: params.running_duration_max_days,
    start_date: params.start_date,
    end_date: params.end_date,
    order: params.order ?? "longest_running",
    limit: params.limit ?? 30,
    cursor: params.cursor,
    live: params.live,
  });
}

// --- Brand Endpoints ---

export async function getAdsByBrandId(
  params: BrandAdsParams
): Promise<ForeplayPaginatedResponse<ForeplayAd>> {
  return foreplayFetch("/api/brand/getAdsByBrandId", {
    brand_ids: params.brand_ids,
    live: params.live,
    display_format: params.display_format ?? ["image"],
    publisher_platform: params.publisher_platform,
    niches: params.niches,
    running_duration_min_days: params.running_duration_min_days,
    running_duration_max_days: params.running_duration_max_days,
    start_date: params.start_date,
    end_date: params.end_date,
    order: params.order ?? "newest",
    limit: params.limit ?? 50,
    cursor: params.cursor,
  });
}

// --- Ad Endpoints ---

export async function getAdDetails(adId: string): Promise<ForeplayAdResponse> {
  return foreplayFetch(`/api/ad/${encodeURIComponent(adId)}`);
}
