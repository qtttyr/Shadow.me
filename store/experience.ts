"use client";

import { create } from "zustand";
import type { Breach, ScanResult, ScanStage, WebTrace } from "@/lib/types";

export type ExperiencePhase =
  | "entrance"   // ввод email
  | "engine"     // engine room: живой пайплайн
  | "manifest"   // 3D тень
  | "collapse"   // схлопывание
  | "blueprint"; // паспорт

export interface EngineStatus {
  engine: string;
  status: "ok" | "empty" | "fail";
  count: number;
  ms: number;
}

interface ExperienceState {
  phase: ExperiencePhase;
  email: string | null;

  // scan pipeline
  stage: ScanStage;
  stageMessage: string;
  engines: EngineStatus[];
  breaches: Breach[]; // накапливаются по мере стрима
  traces: WebTrace[];
  actions: string[];
  result: ScanResult | null;
  error: string | null;

  // AI narrative (streaming, отдельный канал)
  narrative: string;
  narrativeDone: boolean;

  // 3D
  hoveredBreach: Breach | null;
  collapseProgress: number; // 0..1
  clean: boolean;
  scrollProgress: number; // 0..1 спуск в manifest-фазе

  setPhase: (p: ExperiencePhase) => void;
  setEmail: (e: string) => void;
  setStage: (s: ScanStage, message: string) => void;
  addEngine: (e: EngineStatus) => void;
  addBreach: (b: Breach) => void;
  addTrace: (t: WebTrace) => void;
  setActions: (a: string[]) => void;
  setResult: (r: ScanResult) => void;
  setError: (m: string) => void;
  appendNarrative: (d: string) => void;
  setNarrativeDone: () => void;
  setHoveredBreach: (b: Breach | null) => void;
  setCollapseProgress: (v: number) => void;
  setScrollProgress: (v: number) => void;
  setClean: () => void;
  reset: () => void;
}

const initial = {
  phase: "entrance" as ExperiencePhase,
  email: null,
  stage: "idle" as ScanStage,
  stageMessage: "",
  engines: [],
  breaches: [],
  traces: [],
  actions: [],
  result: null,
  error: null,
  narrative: "",
  narrativeDone: false,
  hoveredBreach: null,
  collapseProgress: 0,
  scrollProgress: 0,
  clean: false,
};

export const useExperience = create<ExperienceState>((set) => ({
  ...initial,
  setPhase: (phase) => set({ phase }),
  setEmail: (email) => set({ email }),
  setStage: (stage, stageMessage) => set({ stage, stageMessage }),
  addEngine: (e) =>
    set((s) => ({
      engines: [...s.engines.filter((x) => x.engine !== e.engine), e],
    })),
  addBreach: (b) => set((s) => ({ breaches: [...s.breaches, b] })),
  addTrace: (t) => set((s) => ({ traces: [...s.traces, t] })),
  setActions: (actions) => set({ actions }),
  setResult: (result) => set({ result, breaches: result.breaches }),
  setError: (error) => set({ error, stage: "error" }),
  appendNarrative: (d) => set((s) => ({ narrative: s.narrative + d })),
  setNarrativeDone: () => set({ narrativeDone: true }),
  setHoveredBreach: (hoveredBreach) => set({ hoveredBreach }),
  setCollapseProgress: (collapseProgress) => set({ collapseProgress }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setClean: () => set({ clean: true }),
  reset: () => set(initial),
}));
