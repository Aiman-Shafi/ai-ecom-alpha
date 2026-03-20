"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BrandProfile, Competitor, UsageStats, AdAnalysis, GeneratedAd, UploadedAsset, ErrorLogEntry } from "@/shared/types";
import type { ForeplayAd } from "@/shared/types/foreplay";
import type { TeardownHistoryEntry, TeardownReport, TeardownProgress } from "@/features/teardown/types";
import { defaultBrandProfile, normalizeBrandProfile } from "./brand-profile";

interface ApiKeys {
  openaiKey: string;
  claudeKey: string;
  openrouterKey: string;
  analysisProvider: "openai" | "claude" | "openrouter";
  foreplayKey: string;
  googleAiKey: string;
  apifyToken: string;
}

interface Preferences {
  defaultSort: "newest" | "oldest" | "running_duration";
  gridDensity: "compact" | "comfortable";
  theme: "contrast" | "dark" | "light";
}

interface DiscoverSearch {
  query: string;
  niche: string;
  order: string;
  committed: { query: string; niche: string; order: string } | null;
}

interface AppState {
  // Discover search state (in-memory only, survives tab switches)
  discoverSearch: DiscoverSearch;
  setDiscoverSearch: (updates: Partial<DiscoverSearch>) => void;

  // Knowledge Base
  brandProfile: BrandProfile;
  competitors: Competitor[];
  setBrandProfile: (profile: Partial<BrandProfile>) => void;
  addCompetitor: (competitor: Competitor) => void;
  removeCompetitor: (id: string) => void;
  updateCompetitor: (id: string, updates: Partial<Competitor>) => void;

  // Ad Analyses (keyed by foreplay ad_id)
  analyses: Record<string, AdAnalysis>;
  setAnalysis: (adId: string, analysis: AdAnalysis) => void;

  // Saved Ads (keyed by foreplay ad id — for "Save to Analyze")
  savedAds: Record<string, ForeplayAd>;
  saveAd: (ad: ForeplayAd) => void;
  unsaveAd: (adId: string) => void;

  // Generated Ads
  generatedAds: GeneratedAd[];
  addGeneratedAd: (ad: GeneratedAd) => void;
  removeGeneratedAd: (id: string) => void;
  updateGeneratedAdStatus: (id: string, status: GeneratedAd["status"]) => void;

  // Usage Stats
  usage: UsageStats;
  incrementUsage: (key: keyof UsageStats, amount?: number) => void;

  // Brand Assets (stored as data URLs for local-only mode)
  addBrandAsset: (asset: UploadedAsset, profileField: "logoFiles" | "exampleAds" | "productImages") => void;
  removeBrandAsset: (assetId: string, profileField: "logoFiles" | "exampleAds" | "productImages") => void;

  // Error Logs
  errorLogs: ErrorLogEntry[];
  addErrorLog: (entry: Omit<ErrorLogEntry, "id" | "timestamp">) => void;
  clearErrorLogs: () => void;

  // API Keys
  apiKeys: ApiKeys;
  setApiKeys: (keys: Partial<ApiKeys>) => void;

  // Preferences
  preferences: Preferences;
  setPreferences: (prefs: Partial<Preferences>) => void;

  // Teardown History
  teardownHistory: TeardownHistoryEntry[];
  addTeardownHistory: (entry: TeardownHistoryEntry) => void;
  updateTeardownHistory: (id: string, updates: Partial<TeardownHistoryEntry>) => void;
  removeTeardownHistory: (id: string) => void;

  // Teardown Report Cache (persists completed reports across server restarts)
  teardownReportCache: Record<string, { report: TeardownReport; progress: TeardownProgress }>;
  cacheTeardownReport: (id: string, report: TeardownReport, progress: TeardownProgress) => void;

  // Data Management
  clearAnalyses: () => void;
  resetUsage: () => void;
  resetStore: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      discoverSearch: { query: "", niche: "", order: "longest_running", committed: null },
      setDiscoverSearch: (updates) =>
        set((state) => ({ discoverSearch: { ...state.discoverSearch, ...updates } })),

      brandProfile: defaultBrandProfile,
      competitors: [],
      analyses: {},
      savedAds: {},
      generatedAds: [],
      usage: {
        foreplayCreditsUsed: 0,
        adsDiscovered: 0,
        adsAnalyzed: 0,
        adsGenerated: 0,
        generationCostUsd: 0,
      },

      setBrandProfile: (profile) =>
        set((state) => ({
          brandProfile: normalizeBrandProfile({ ...state.brandProfile, ...profile }),
        })),

      addCompetitor: (competitor) =>
        set((state) => ({
          competitors: [...state.competitors, competitor],
        })),

      removeCompetitor: (id) =>
        set((state) => ({
          competitors: state.competitors.filter((c) => c.id !== id),
        })),

      updateCompetitor: (id, updates) =>
        set((state) => ({
          competitors: state.competitors.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      setAnalysis: (adId, analysis) =>
        set((state) => ({
          analyses: { ...state.analyses, [adId]: analysis },
        })),

      saveAd: (ad) =>
        set((state) => ({
          savedAds: { ...state.savedAds, [ad.id]: ad },
        })),

      unsaveAd: (adId) =>
        set((state) => {
          const { [adId]: _, ...rest } = state.savedAds;
          return { savedAds: rest };
        }),

      addGeneratedAd: (ad) =>
        set((state) => ({
          generatedAds: [ad, ...state.generatedAds],
        })),

      removeGeneratedAd: (id) =>
        set((state) => ({
          generatedAds: state.generatedAds.filter((a) => a.id !== id),
        })),

      updateGeneratedAdStatus: (id, status) =>
        set((state) => ({
          generatedAds: state.generatedAds.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        })),

      incrementUsage: (key, amount = 1) =>
        set((state) => ({
          usage: { ...state.usage, [key]: state.usage[key] + amount },
        })),

      addBrandAsset: (asset, profileField) =>
        set((state) => ({
          brandProfile: {
            ...normalizeBrandProfile(state.brandProfile),
            [profileField]: [...state.brandProfile[profileField], asset],
          },
        })),

      removeBrandAsset: (assetId, profileField) =>
        set((state) => ({
          brandProfile: {
            ...normalizeBrandProfile(state.brandProfile),
            [profileField]: state.brandProfile[profileField].filter(
              (a) => a.id !== assetId
            ),
          },
        })),

      teardownHistory: [],
      addTeardownHistory: (entry) =>
        set((state) => ({
          teardownHistory: [entry, ...state.teardownHistory].slice(0, 50),
        })),
      updateTeardownHistory: (id, updates) =>
        set((state) => ({
          teardownHistory: state.teardownHistory.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      removeTeardownHistory: (id) =>
        set((state) => ({
          teardownHistory: state.teardownHistory.filter((t) => t.id !== id),
        })),

      teardownReportCache: {},
      cacheTeardownReport: (id, report, progress) =>
        set((state) => {
          const cache = { ...state.teardownReportCache, [id]: { report, progress } };
          // Keep cache in sync with history — only retain entries that exist in history
          const historyIds = new Set(state.teardownHistory.map((h) => h.id));
          for (const key of Object.keys(cache)) {
            if (!historyIds.has(key)) delete cache[key];
          }
          return { teardownReportCache: cache };
        }),

      errorLogs: [],
      addErrorLog: (entry) =>
        set((state) => ({
          errorLogs: [
            {
              ...entry,
              id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: new Date().toISOString(),
            },
            ...state.errorLogs,
          ].slice(0, 200), // keep last 200 entries
        })),
      clearErrorLogs: () => set({ errorLogs: [] }),

      apiKeys: { openaiKey: "", claudeKey: "", openrouterKey: "", analysisProvider: "openai", foreplayKey: "", googleAiKey: "", apifyToken: "" },
      setApiKeys: (keys) =>
        set((state) => ({ apiKeys: { ...state.apiKeys, ...keys } })),

      preferences: { defaultSort: "newest", gridDensity: "comfortable", theme: "contrast" },
      setPreferences: (prefs) =>
        set((state) => ({ preferences: { ...state.preferences, ...prefs } })),

      clearAnalyses: () => set({ analyses: {} }),

      resetUsage: () =>
        set({ usage: { foreplayCreditsUsed: 0, adsDiscovered: 0, adsAnalyzed: 0, adsGenerated: 0, generationCostUsd: 0 } }),

      resetStore: () =>
        set({
          brandProfile: defaultBrandProfile,
          competitors: [],
          analyses: {},
          savedAds: {},
          generatedAds: [],
          usage: { foreplayCreditsUsed: 0, adsDiscovered: 0, adsAnalyzed: 0, adsGenerated: 0, generationCostUsd: 0 },
          apiKeys: { openaiKey: "", claudeKey: "", openrouterKey: "", analysisProvider: "openai", foreplayKey: "", googleAiKey: "", apifyToken: "" },
          preferences: { defaultSort: "newest", gridDensity: "comfortable", theme: "contrast" },
          errorLogs: [],
          teardownHistory: [],
        }),
    }),
    {
      name: "ai-ecom-engine-store",
      storage: {
        getItem: (name: string) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name: string, value: unknown) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (e) {
            // Quota exceeded — prune heavy keys and retry
            if (e instanceof DOMException && e.name === "QuotaExceededError") {
              try {
                const parsed = (typeof value === "string" ? JSON.parse(value) : value) as Record<string, Record<string, unknown>>;
                if (parsed?.state) {
                  parsed.state.errorLogs = (parsed.state.errorLogs as unknown[] ?? []).slice(0, 20);
                  parsed.state.generatedAds = (parsed.state.generatedAds as unknown[] ?? []).slice(0, 20);
                }
                localStorage.setItem(name, JSON.stringify(parsed));
              } catch {
                // Last resort — skip this write
                console.warn("localStorage quota exceeded, skipping persist");
              }
            }
          }
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      },
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<AppState> | undefined;

        return {
          ...currentState,
          ...typedPersistedState,
          brandProfile: normalizeBrandProfile(typedPersistedState?.brandProfile),
        };
      },
      partialize: (state) => ({
        brandProfile: state.brandProfile,
        competitors: state.competitors,
        analyses: state.analyses,
        savedAds: state.savedAds,
        generatedAds: state.generatedAds.slice(0, 50),
        usage: state.usage,
        errorLogs: state.errorLogs.slice(0, 50),
        apiKeys: state.apiKeys,
        preferences: state.preferences,
        teardownHistory: state.teardownHistory,
        // teardownReportCache excluded — reports persist to disk via .tmp/teardowns/
      }),
    }
  )
);
