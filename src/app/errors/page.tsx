"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { AlertTriangle, Trash2, Brain, Sparkles, Globe, HelpCircle } from "lucide-react";

const sourceIcons = {
  analysis: Brain,
  generation: Sparkles,
  foreplay: Globe,
  other: HelpCircle,
};

const sourceColors = {
  analysis: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  generation: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  foreplay: "bg-green-500/10 text-green-400 border-green-500/20",
  other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function ErrorsPage() {
  const { errorLogs, clearErrorLogs } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Error Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Debug log of all errors. {errorLogs.length} total entries.
          </p>
        </div>
        {errorLogs.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearErrorLogs}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {errorLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No errors logged</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Errors from analysis, generation, and API calls will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {errorLogs.map((entry) => {
            const Icon = sourceIcons[entry.source];
            return (
              <Card key={entry.id} className="border-destructive/20">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-destructive shrink-0" />
                      <span className="text-sm font-semibold">{entry.message}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={sourceColors[entry.source]}>
                        {entry.source}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Context */}
                  {entry.context && (
                    <div className="text-xs text-muted-foreground">
                      {entry.context}
                    </div>
                  )}

                  {/* Full error details */}
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <pre className="text-xs text-destructive/90 whitespace-pre-wrap break-all font-mono leading-relaxed">
                      {entry.details}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
