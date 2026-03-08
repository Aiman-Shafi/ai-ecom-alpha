export interface ForeplayBrand {
  id: string;
  name: string;
  domain: string;
  avatar: string | null;
  facebook_page_id: string | null;
  niche: string | null;
  ad_count: number;
}

export interface ForeplayAd {
  id: string;
  ad_id: string;
  brand_id: string;
  name: string;
  description: string;
  cta_title: string | null;
  categories: string[];
  languages: string[];
  market_target: string | null;
  niches: string[];
  product_category: string | null;
  full_transcription: string | null;
  avatar: string | null;
  cta_type: string | null;
  display_format: string;
  link_url: string | null;
  live: boolean;
  publisher_platform: string[];
  started_running: number;
  thumbnail: string | null;
  image: string | null;
  video: string | null;
  running_duration: { days: number };
  cards: Record<string, unknown>[];
}

export interface ForeplayPaginatedResponse<T> {
  data: T[];
  metadata: {
    cursor: number | null;
    filters: Record<string, unknown>;
    count: number;
    order: string;
  };
}

export interface ForeplayAdResponse {
  data: ForeplayAd;
  metadata: {
    success: boolean;
    message: string;
    status_code: number;
    processed_at: number;
  };
}

export interface DiscoverBrandsParams {
  query?: string;
  niches?: string[];
  limit?: number;
  cursor?: number;
}

export interface DiscoverAdsParams {
  query?: string;
  niches?: string[];
  display_format?: string[];
  publisher_platform?: string[];
  running_duration_min_days?: number;
  running_duration_max_days?: number;
  start_date?: string;
  end_date?: string;
  order?: "newest" | "oldest" | "longest_running" | "most_relevant";
  limit?: number;
  cursor?: number;
  live?: boolean;
}

export interface BrandAdsParams {
  brand_ids: string[];
  live?: boolean;
  display_format?: string[];
  publisher_platform?: string[];
  niches?: string[];
  running_duration_min_days?: number;
  running_duration_max_days?: number;
  start_date?: string;
  end_date?: string;
  order?: "newest" | "oldest" | "longest_running" | "most_relevant";
  limit?: number;
  cursor?: number;
}
