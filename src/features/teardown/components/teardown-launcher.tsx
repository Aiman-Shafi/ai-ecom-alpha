"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { Spinner } from "@/shared/components/ui/spinner";
import { Crosshair } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import type { TeardownRequest } from "../types";

interface TeardownLauncherProps {
  onStart: (request: TeardownRequest) => void;
  isLoading: boolean;
}

export function TeardownLauncher({ onStart, isLoading }: TeardownLauncherProps) {
  const [competitorName, setCompetitorName] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [selectedCompetitorId, setSelectedCompetitorId] = useState("");
  const [useForeplay, setUseForeplay] = useState(true);
  const [useMeta, setUseMeta] = useState(false);
  const [useTikTok, setUseTikTok] = useState(false);
  const [maxAds, setMaxAds] = useState("5");

  const competitors = useAppStore((s) => s.competitors);
  const brandProfile = useAppStore((s) => s.brandProfile);
  const apiKeys = useAppStore((s) => s.apiKeys);

  const hasForeplayKey = !!apiKeys.foreplayKey;
  const hasApifyToken = !!apiKeys.apifyToken;
  const hasAnalysisKey = !!(apiKeys.openaiKey || apiKeys.claudeKey || apiKeys.openrouterKey);

  const sourcesSelected = useForeplay || useMeta || useTikTok;
  const canStart = competitorName.trim() && sourcesSelected && hasAnalysisKey && !isLoading;

  const handleCompetitorSelect = (id: string) => {
    setSelectedCompetitorId(id);
    if (id) {
      const comp = competitors.find((c) => c.id === id);
      if (comp) {
        setCompetitorName(comp.name);
        setCompetitorUrl(comp.url);
      }
    }
  };

  const handleSubmit = () => {
    if (!canStart) return;

    const sources: TeardownRequest["sources"] = [];
    if (useForeplay) sources.push("foreplay");
    if (useMeta) sources.push("meta_apify");
    if (useTikTok) sources.push("tiktok_apify");

    const selectedComp = competitors.find((c) => c.id === selectedCompetitorId);

    onStart({
      competitorName: competitorName.trim(),
      competitorUrl: competitorUrl.trim() || undefined,
      foreplayBrandId: selectedComp?.foreplayBrandId || undefined,
      sources,
      maxAdsToAnalyze: Number(maxAds),
      brandProfile,
      apiKeys: {
        foreplayKey: apiKeys.foreplayKey,
        apifyToken: apiKeys.apifyToken,
        openaiKey: apiKeys.openaiKey,
        claudeKey: apiKeys.claudeKey,
        openrouterKey: apiKeys.openrouterKey,
        googleAiKey: apiKeys.googleAiKey,
        analysisProvider: apiKeys.analysisProvider || "openai",
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Competitor</label>
          {competitors.length > 0 ? (
            <Select
              value={selectedCompetitorId}
              onChange={(e) => handleCompetitorSelect(e.target.value)}
              className="w-full"
            >
              <option value="">Select from Knowledge Base...</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              placeholder="Competitor brand name..."
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          )}
          <Input
            placeholder="Competitor URL (optional)"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Data Sources</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useForeplay}
                onChange={(e) => setUseForeplay(e.target.checked)}
                disabled={!hasForeplayKey}
                className="rounded"
              />
              <span className={!hasForeplayKey ? "text-muted-foreground/50" : ""}>
                Foreplay
              </span>
              {!hasForeplayKey && (
                <span className="text-[10px] text-muted-foreground">(no key)</span>
              )}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useMeta}
                onChange={(e) => setUseMeta(e.target.checked)}
                disabled={!hasApifyToken}
                className="rounded"
              />
              <span className={!hasApifyToken ? "text-muted-foreground/50" : ""}>
                Meta Ad Library
              </span>
              {!hasApifyToken && (
                <span className="text-[10px] text-muted-foreground">(no Apify token)</span>
              )}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useTikTok}
                onChange={(e) => setUseTikTok(e.target.checked)}
                disabled={!hasApifyToken}
                className="rounded"
              />
              <span className={!hasApifyToken ? "text-muted-foreground/50" : ""}>
                TikTok Top Ads
              </span>
              {!hasApifyToken && (
                <span className="text-[10px] text-muted-foreground">(no Apify token)</span>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Max Ads to Analyze</label>
          <Select
            value={maxAds}
            onChange={(e) => setMaxAds(e.target.value)}
            className="w-40"
          >
            <option value="3">3 ads</option>
            <option value="5">5 ads</option>
            <option value="8">8 ads</option>
            <option value="10">10 ads</option>
          </Select>
        </div>

        {!hasAnalysisKey && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            At least one analysis API key (OpenAI, Claude, or OpenRouter) is required.
            Configure in Settings.
          </p>
        )}
      </div>

      <Button onClick={handleSubmit} disabled={!canStart} className="w-full">
        {isLoading ? (
          <>
            <Spinner className="h-4 w-4 mr-2" />
            Starting Teardown...
          </>
        ) : (
          <>
            <Crosshair className="h-4 w-4 mr-2" />
            Start Competitor Analysis
          </>
        )}
      </Button>
    </div>
  );
}
