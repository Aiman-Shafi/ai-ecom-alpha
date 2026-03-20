import fs from "fs";
import path from "path";
import type { TeardownProgress, TeardownReport, TeardownPhase, TeardownStepStatus } from "../types";

interface TeardownState {
  progress: TeardownProgress;
  report?: TeardownReport;
}

// ── File-based persistence for completed teardowns ──
const PERSIST_DIR = path.join(process.cwd(), ".tmp", "teardowns");

function ensurePersistDir() {
  if (!fs.existsSync(PERSIST_DIR)) {
    fs.mkdirSync(PERSIST_DIR, { recursive: true });
  }
}

function persistToDisk(id: string, state: TeardownState) {
  try {
    ensurePersistDir();
    fs.writeFileSync(
      path.join(PERSIST_DIR, `${id}.json`),
      JSON.stringify(state),
      "utf-8"
    );
  } catch {
    // Silently fail — persistence is best-effort
  }
}

function loadFromDisk(id: string): TeardownState | undefined {
  try {
    const filePath = path.join(PERSIST_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return undefined;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TeardownState;
  } catch {
    return undefined;
  }
}

// ── In-memory store (hot path for running teardowns) ──
const globalKey = "__teardown_store__" as const;
const globalStore = globalThis as unknown as Record<string, Map<string, TeardownState>>;
if (!globalStore[globalKey]) {
  globalStore[globalKey] = new Map<string, TeardownState>();
}
const teardowns = globalStore[globalKey];

export function getTeardown(id: string): TeardownState | undefined {
  // Check in-memory first, then fall back to disk
  const mem = teardowns.get(id);
  if (mem) return mem;

  const disk = loadFromDisk(id);
  if (disk) {
    // Re-hydrate into memory for subsequent reads
    teardowns.set(id, disk);
    return disk;
  }
  return undefined;
}

export function setTeardown(id: string, state: TeardownState): void {
  teardowns.set(id, state);
}

export function updateProgress(id: string, updates: Partial<TeardownProgress>): void {
  const state = teardowns.get(id);
  if (!state) return;
  state.progress = { ...state.progress, ...updates };

  // Persist when a teardown completes or fails
  if (updates.overallStatus === "completed" || updates.overallStatus === "failed") {
    persistToDisk(id, state);
  }
}

export function updateStep(
  id: string,
  phase: TeardownPhase,
  updates: Partial<TeardownStepStatus>
): void {
  const state = teardowns.get(id);
  if (!state) return;
  const step = state.progress.steps.find((s) => s.phase === phase);
  if (step) {
    Object.assign(step, updates);
  }
}

export function setReport(id: string, report: TeardownReport): void {
  const state = teardowns.get(id);
  if (!state) return;
  state.report = report;
  // Persist the report to disk
  persistToDisk(id, state);
}

export function getReport(id: string): TeardownReport | undefined {
  return getTeardown(id)?.report;
}
