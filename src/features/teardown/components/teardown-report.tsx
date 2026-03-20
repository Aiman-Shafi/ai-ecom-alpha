"use client";

import { useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  BarChart3,
  Target,
  Globe,
  Lightbulb,
  Crosshair,
  Image as ImageIcon,
  Video,
  ExternalLink,
} from "lucide-react";
import type { TeardownReport as TeardownReportType } from "../types";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "strategy", label: "Ad Strategy", icon: Target },
  { id: "ads", label: "Top Ads", icon: ImageIcon },
  { id: "pages", label: "Landing Pages", icon: Globe },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "positioning", label: "Positioning", icon: Crosshair },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface TeardownReportProps {
  report: TeardownReportType;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ChipList({ items, color = "bg-zinc-800 text-zinc-300" }: { items: string[]; color?: string }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">None identified</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} className={`text-xs ${color}`}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

function OverviewTab({ report }: { report: TeardownReportType }) {
  const { synthesis, adsSummary } = report;
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <p className="text-sm leading-relaxed">{synthesis.executiveSummary}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Ads Discovered" value={adsSummary.totalDiscovered} />
        <MetricCard label="Ads Analyzed" value={adsSummary.totalAnalyzed} />
        <MetricCard label="Avg Running Days" value={adsSummary.avgRunningDays} />
        <MetricCard label="Longest Running" value={`${adsSummary.longestRunningDays}d`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Image Ads</p>
          </div>
          <p className="text-2xl font-semibold">{adsSummary.formatBreakdown.image}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Video className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Video Ads</p>
          </div>
          <p className="text-2xl font-semibold">{adsSummary.formatBreakdown.video}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Platforms</p>
        <ChipList items={adsSummary.platforms} />
      </div>
    </div>
  );
}

function StrategyTab({ report }: { report: TeardownReportType }) {
  const { adStrategyBreakdown } = report.synthesis;
  return (
    <div className="space-y-5">
      <Section label="Primary Hook Types">
        <ChipList items={adStrategyBreakdown.primaryHookTypes} color="bg-yellow-500/10 text-yellow-400" />
      </Section>
      <Section label="Dominant Formats">
        <ChipList items={adStrategyBreakdown.dominantFormats} color="bg-blue-500/10 text-blue-400" />
      </Section>
      <Section label="Common CTAs">
        <ChipList items={adStrategyBreakdown.commonCTAs} color="bg-green-500/10 text-green-400" />
      </Section>
      <Section label="Messaging Themes">
        <ChipList items={adStrategyBreakdown.messagingThemes} />
      </Section>
      <Section label="Visual Patterns">
        <ChipList items={adStrategyBreakdown.visualPatterns} />
      </Section>
      <Section label="Audience Angle">
        <p className="text-sm">{adStrategyBreakdown.audienceAngle}</p>
      </Section>
    </div>
  );
}

function AdsTab({ report }: { report: TeardownReportType }) {
  return (
    <div className="space-y-3">
      {report.topAds.map((entry) => (
        <Card key={entry.ad.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {(entry.ad.image || entry.ad.thumbnail) && (
                <a
                  href={entry.ad.link_url || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 group relative ${
                    entry.ad.link_url ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.ad.image || entry.ad.thumbnail || ""}
                    alt={entry.ad.name}
                    className="w-full h-full object-cover"
                  />
                  {entry.ad.link_url && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="h-4 w-4 text-white" />
                    </div>
                  )}
                </a>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {entry.ad.link_url ? (
                    <a
                      href={entry.ad.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium truncate hover:underline"
                    >
                      {entry.ad.name}
                    </a>
                  ) : (
                    <p className="text-sm font-medium truncate">{entry.ad.name}</p>
                  )}
                  <Badge className="text-[10px] bg-zinc-800 text-zinc-300">
                    #{entry.rank}
                  </Badge>
                  {entry.analysis && (
                    <Badge className="text-[10px] bg-green-500/10 text-green-400">
                      {entry.analysis.overallScore}/10
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {entry.ad.description || "No copy"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {entry.ad.display_format}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {entry.ad.running_duration.days}d running
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {entry.ad.publisher_platform.join(", ")}
                  </span>
                </div>
                {entry.analysisError && (
                  <p className="text-xs text-destructive mt-1">{entry.analysisError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {report.topAds.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No ads analyzed</p>
      )}
    </div>
  );
}

function LandingPagesTab({ report }: { report: TeardownReportType }) {
  const { landingPagePatterns } = report.synthesis;
  return (
    <div className="space-y-6">
      {report.landingPages.length > 0 && (
        <div className="space-y-3">
          {report.landingPages.map((entry, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-400 hover:underline truncate block"
                >
                  {entry.url}
                </a>
                {entry.intel ? (
                  <div className="space-y-1.5">
                    {entry.intel.headline && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Headline:</span> {entry.intel.headline}
                      </p>
                    )}
                    {entry.intel.cta && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">CTA:</span> {entry.intel.cta}
                      </p>
                    )}
                    {entry.intel.offers.length > 0 && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Offers:</span>{" "}
                        {entry.intel.offers.join("; ")}
                      </p>
                    )}
                    {entry.intel.pricePoints.length > 0 && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Prices:</span>{" "}
                        {entry.intel.pricePoints.join("; ")}
                      </p>
                    )}
                    {entry.intel.socialProof.length > 0 && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Social Proof:</span>{" "}
                        {entry.intel.socialProof.join("; ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {entry.scrapeError || "No data extracted"}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Section label="Pricing Strategy">
        <p className="text-sm">{landingPagePatterns.pricingStrategy}</p>
      </Section>
      <Section label="Social Proof Usage">
        <p className="text-sm">{landingPagePatterns.socialProofUsage}</p>
      </Section>
      <Section label="Common Offers">
        <ChipList items={landingPagePatterns.commonOffers} />
      </Section>
      <Section label="Conversion Tactics">
        <ChipList items={landingPagePatterns.conversionTactics} color="bg-purple-500/10 text-purple-400" />
      </Section>
    </div>
  );
}

function RecommendationsTab({ report }: { report: TeardownReportType }) {
  const { strengthsAndWeaknesses, actionableRecommendations } = report.synthesis;
  return (
    <div className="space-y-6">
      <Section label="Competitor Strengths">
        <ItemList items={strengthsAndWeaknesses.strengths} icon="+" color="text-green-400" />
      </Section>
      <Section label="Competitor Weaknesses">
        <ItemList items={strengthsAndWeaknesses.weaknesses} icon="-" color="text-red-400" />
      </Section>
      <Section label="Gaps You Can Exploit">
        <ItemList items={strengthsAndWeaknesses.gaps} icon="*" color="text-yellow-400" />
      </Section>

      <div className="border-t border-border pt-6">
        <Section label="Quick Wins (This Week)">
          <ItemList items={actionableRecommendations.quickWins} icon=">" color="text-green-400" />
        </Section>
      </div>
      <Section label="Strategic Moves">
        <ItemList items={actionableRecommendations.strategicMoves} icon=">" color="text-blue-400" />
      </Section>
      <Section label="Ad Concept Ideas to Test">
        <ItemList items={actionableRecommendations.adConceptIdeas} icon=">" color="text-purple-400" />
      </Section>
    </div>
  );
}

function PositioningTab({ report }: { report: TeardownReportType }) {
  return (
    <div className="bg-muted/30 rounded-lg p-6 border border-border">
      <p className="text-sm leading-relaxed whitespace-pre-line">
        {report.synthesis.competitivePositioning}
      </p>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

function ItemList({
  items,
  icon,
  color,
}: {
  items: string[];
  icon: string;
  color: string;
}) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">None identified</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className={`flex-shrink-0 font-mono ${color}`}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TeardownReport({ report }: TeardownReportProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {report.competitor.avatar && (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.competitor.avatar}
              alt={report.competitor.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold">{report.competitor.name}</h2>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(report.generatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-orange-500" : ""}`} />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-[300px]">
        {activeTab === "overview" && <OverviewTab report={report} />}
        {activeTab === "strategy" && <StrategyTab report={report} />}
        {activeTab === "ads" && <AdsTab report={report} />}
        {activeTab === "pages" && <LandingPagesTab report={report} />}
        {activeTab === "recommendations" && <RecommendationsTab report={report} />}
        {activeTab === "positioning" && <PositioningTab report={report} />}
      </div>
    </div>
  );
}
