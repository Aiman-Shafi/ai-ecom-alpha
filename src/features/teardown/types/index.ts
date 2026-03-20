import type { ForeplayAd } from "@/shared/types/foreplay";
import type { AdAnalysis, BrandProfile } from "@/shared/types";

// --- Apify / Scraping Types (moved from openclaw) ---

export interface CrawlOptions {
  maxResults?: number;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  country?: string;
  activeOnly?: boolean;
}

export interface ScrapedAd {
  id: string;
  crawlTaskId: string;
  source: "meta" | "tiktok";
  advertiserName: string;
  adText: string;
  imageUrl?: string;
  videoUrl?: string;
  landingPageUrl?: string;
  startDate?: string;
  isActive: boolean;
  platform: string[];
  estimatedReach?: string;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
  };
}

export interface LandingPageIntel {
  url: string;
  headline: string;
  subheadline?: string;
  cta: string;
  offers: string[];
  socialProof: string[];
  pricePoints: string[];
  rawContent?: string;
}

export interface ApifyAgentTask {
  task_id: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  result?: string;
  error?: string;
}

// --- Teardown Request ---

export interface TeardownRequest {
  competitorName: string;
  competitorUrl?: string;
  foreplayBrandId?: string;
  sources: ("foreplay" | "meta_apify" | "tiktok_apify")[];
  maxAdsToAnalyze: number;
  brandProfile: BrandProfile;
  apiKeys: {
    foreplayKey?: string;
    apifyToken?: string;
    openaiKey?: string;
    claudeKey?: string;
    openrouterKey?: string;
    googleAiKey?: string;
    analysisProvider: "openai" | "claude" | "openrouter";
  };
}

// --- Teardown Progress ---

export type TeardownPhase =
  | "resolving"
  | "discovering"
  | "selecting"
  | "analyzing"
  | "scraping_pages"
  | "synthesizing"
  | "completed"
  | "failed";

export interface TeardownStepStatus {
  phase: TeardownPhase;
  label: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  detail?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface TeardownProgress {
  id: string;
  competitorName: string;
  overallStatus: "running" | "completed" | "failed";
  steps: TeardownStepStatus[];
  currentPhase: TeardownPhase;
  startedAt: string;
  completedAt?: string;
  resolvedBrand?: {
    id: string;
    name: string;
    domain: string;
    avatar: string | null;
  };
  discoveredAdsCount?: number;
  selectedAdsCount?: number;
  analyzedAdsCount?: number;
  scrapedPagesCount?: number;
}

// --- Teardown Report ---

export interface TeardownReport {
  id: string;
  generatedAt: string;
  competitor: {
    name: string;
    url?: string;
    foreplayBrandId?: string;
    avatar?: string | null;
  };
  adsSummary: {
    totalDiscovered: number;
    totalAnalyzed: number;
    platforms: string[];
    avgRunningDays: number;
    longestRunningDays: number;
    formatBreakdown: { image: number; video: number };
  };
  topAds: TeardownAdEntry[];
  landingPages: TeardownLandingPageEntry[];
  synthesis: TeardownSynthesis;
}

export interface TeardownAdEntry {
  ad: ForeplayAd;
  analysis: AdAnalysis | null;
  analysisError?: string;
  rank: number;
}

export interface TeardownLandingPageEntry {
  url: string;
  intel: LandingPageIntel | null;
  scrapeError?: string;
  linkedAdIds: string[];
}

export interface TeardownSynthesis {
  executiveSummary: string;
  adStrategyBreakdown: {
    primaryHookTypes: string[];
    dominantFormats: string[];
    commonCTAs: string[];
    messagingThemes: string[];
    visualPatterns: string[];
    audienceAngle: string;
  };
  landingPagePatterns: {
    commonOffers: string[];
    pricingStrategy: string;
    socialProofUsage: string;
    conversionTactics: string[];
  };
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    gaps: string[];
  };
  actionableRecommendations: {
    quickWins: string[];
    strategicMoves: string[];
    adConceptIdeas: string[];
  };
  competitivePositioning: string;
}

// --- Teardown History (for Zustand store) ---

export interface TeardownHistoryEntry {
  id: string;
  competitorName: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed";
  adCount: number;
}
