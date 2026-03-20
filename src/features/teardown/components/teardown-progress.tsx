"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Circle,
  SkipForward,
} from "lucide-react";
import type { TeardownProgress as TeardownProgressType, TeardownStepStatus } from "../types";

const STEP_ICONS = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle,
  failed: XCircle,
  skipped: SkipForward,
};

const STEP_COLORS = {
  pending: "text-zinc-500",
  running: "text-yellow-400",
  completed: "text-green-400",
  failed: "text-red-400",
  skipped: "text-zinc-500",
};

const LINE_COLORS = {
  pending: "bg-zinc-700",
  running: "bg-yellow-400/30",
  completed: "bg-green-400/30",
  failed: "bg-red-400/30",
  skipped: "bg-zinc-700",
};

function ElapsedTimer({ startedAt, endedAt }: { startedAt: string; endedAt?: string }) {
  const [elapsed, setElapsed] = useState(() => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    return Math.floor((end - start) / 1000);
  });

  useEffect(() => {
    if (endedAt) {
      const start = new Date(startedAt).getTime();
      const end = new Date(endedAt).getTime();
      setElapsed(Math.floor((end - start) / 1000));
      return;
    }
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, endedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return (
    <span className="text-xs text-muted-foreground font-mono">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

function StepRow({ step, isLast }: { step: TeardownStepStatus; isLast: boolean }) {
  const Icon = STEP_ICONS[step.status];
  const color = STEP_COLORS[step.status];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex-shrink-0 ${color}`}>
          <Icon
            className={`h-5 w-5 ${step.status === "running" ? "animate-spin" : ""}`}
          />
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${LINE_COLORS[step.status]}`} />
        )}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium ${
              step.status === "pending" ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {step.label}
          </p>
          {step.status === "running" && step.startedAt && (
            <ElapsedTimer startedAt={step.startedAt} />
          )}
        </div>
        {step.detail && (
          <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
        )}
        {step.error && (
          <p className="text-xs text-destructive mt-0.5">{step.error}</p>
        )}
      </div>
    </div>
  );
}

interface TeardownProgressProps {
  progress: TeardownProgressType;
}

export function TeardownProgress({ progress }: TeardownProgressProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold">
              Teardown: {progress.competitorName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {progress.overallStatus === "running"
                ? "In progress..."
                : progress.overallStatus === "completed"
                ? "Completed"
                : "Failed"}
            </p>
          </div>
          <ElapsedTimer startedAt={progress.startedAt} endedAt={progress.completedAt} />
        </div>

        <div>
          {progress.steps.map((step, i) => (
            <StepRow
              key={step.phase}
              step={step}
              isLast={i === progress.steps.length - 1}
            />
          ))}
        </div>

        {(progress.discoveredAdsCount !== undefined ||
          progress.analyzedAdsCount !== undefined) && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-border">
            {progress.discoveredAdsCount !== undefined && (
              <div className="text-center">
                <p className="text-lg font-semibold">{progress.discoveredAdsCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Discovered
                </p>
              </div>
            )}
            {progress.selectedAdsCount !== undefined && (
              <div className="text-center">
                <p className="text-lg font-semibold">{progress.selectedAdsCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Selected
                </p>
              </div>
            )}
            {progress.analyzedAdsCount !== undefined && (
              <div className="text-center">
                <p className="text-lg font-semibold">{progress.analyzedAdsCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Analyzed
                </p>
              </div>
            )}
            {progress.scrapedPagesCount !== undefined && (
              <div className="text-center">
                <p className="text-lg font-semibold">{progress.scrapedPagesCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Pages Scraped
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
