"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Spinner } from "@/shared/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import type { AdAnalysis } from "@/shared/types";
import type { ForeplayAd } from "@/shared/types/foreplay";
import { useAppStore } from "@/shared/lib/store";
import { X, Sparkles, Copy } from "lucide-react";
import Image from "next/image";

interface AnalysisModalProps {
  ad: ForeplayAd;
  onClose: () => void;
  onDuplicate: (ad: ForeplayAd, analysis: AdAnalysis) => void;
}

export function AnalysisModal({ ad, onClose, onDuplicate }: AnalysisModalProps) {
  const { brandProfile, analyses, setAnalysis, incrementUsage } = useAppStore();
  const existingAnalysis = analyses[ad.id];
  const [analysis, setLocalAnalysis] = useState<AdAnalysis | null>(existingAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openaiKey, setOpenaiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("openai_api_key") || "";
    }
    return "";
  });

  const runAnalysis = async () => {
    if (!openaiKey) {
      setError("Please enter your OpenAI API key");
      return;
    }
    localStorage.setItem("openai_api_key", openaiKey);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, brandProfile, openaiApiKey: openaiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setLocalAnalysis(data.data);
      setAnalysis(ad.id, data.data);
      incrementUsage("adsAnalyzed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = ad.image || ad.thumbnail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ad Analysis</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Ad preview */}
          <div className="space-y-4">
            {imageUrl && (
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted">
                <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            {ad.description && (
              <div className="text-sm text-muted-foreground">{ad.description}</div>
            )}
            <div className="text-xs text-muted-foreground">
              Running for {ad.running_duration?.days ?? 0} days
              {ad.publisher_platform?.length > 0 && ` on ${ad.publisher_platform.join(", ")}`}
            </div>
          </div>

          {/* Right: Analysis */}
          <div className="space-y-4">
            {!analysis && !loading && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Analyze this ad with GPT-4o Vision to understand why it converts.
                </p>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">OpenAI API Key</label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={runAnalysis}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Ad
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-muted-foreground">Analyzing with GPT-4o Vision...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                {/* Score */}
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">{analysis.overallScore}/10</div>
                  <div>
                    <div className="text-sm font-medium">Overall Score</div>
                    <div className="text-xs text-muted-foreground">
                      Relevance: {analysis.relevanceToBrand.score}/10
                    </div>
                  </div>
                </div>

                {/* Hook */}
                <Card>
                  <CardHeader><h3 className="text-sm font-semibold">Hook</h3></CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-sm font-medium">&ldquo;{analysis.conversionElements.hook.text}&rdquo;</p>
                    <div className="flex gap-2">
                      <Badge>{analysis.conversionElements.hook.type}</Badge>
                      <Badge variant="outline">{analysis.conversionElements.hook.effectivenessScore}/10</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{analysis.conversionElements.hook.whyItWorks}</p>
                  </CardContent>
                </Card>

                {/* Visual */}
                <Card>
                  <CardHeader><h3 className="text-sm font-semibold">Visual Hierarchy</h3></CardHeader>
                  <CardContent className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="text-foreground font-medium">Layout:</span> {analysis.conversionElements.visualHierarchy.layoutType}</p>
                    <p><span className="text-foreground font-medium">Focal point:</span> {analysis.conversionElements.visualHierarchy.focalPoint}</p>
                    <p><span className="text-foreground font-medium">Flow:</span> {analysis.conversionElements.visualHierarchy.visualFlow}</p>
                  </CardContent>
                </Card>

                {/* Colors */}
                <Card>
                  <CardHeader><h3 className="text-sm font-semibold">Color Psychology</h3></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      {analysis.conversionElements.colorPsychology.dominantColors.map((c) => (
                        <div key={c} className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: c }} />
                          <span className="text-xs text-muted-foreground">{c}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{analysis.conversionElements.colorPsychology.emotionalImpact}</p>
                  </CardContent>
                </Card>

                {/* Copy analysis */}
                <Card>
                  <CardHeader><h3 className="text-sm font-semibold">Copy Analysis</h3></CardHeader>
                  <CardContent className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="text-foreground font-medium">Headline:</span> {analysis.conversionElements.copyAnalysis.headline}</p>
                    <p>{analysis.conversionElements.copyAnalysis.bodyCopySummary}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {analysis.conversionElements.copyAnalysis.powerWords.map((w) => (
                        <Badge key={w} variant="outline" className="text-[10px]">{w}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Replication Brief */}
                <Card className="border-primary/30">
                  <CardHeader><h3 className="text-sm font-semibold text-primary">Replication Brief</h3></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div>
                      <span className="text-foreground font-medium">Keep:</span>
                      <ul className="list-disc pl-4 text-muted-foreground mt-1">
                        {analysis.replicationBrief.mustKeepElements.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Suggested headline:</span>
                      <p className="text-muted-foreground mt-0.5">&ldquo;{analysis.replicationBrief.textToRender.headline}&rdquo;</p>
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Suggested CTA:</span>
                      <p className="text-muted-foreground mt-0.5">&ldquo;{analysis.replicationBrief.textToRender.cta}&rdquo;</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => onDuplicate(ad, analysis)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate This Ad
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
