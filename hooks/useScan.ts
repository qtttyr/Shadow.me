"use client";

import { useCallback, useRef } from "react";
import { useExperience } from "@/store/experience";
import type { ScanEvent } from "@/lib/types";

/**
 * Запускает сканирование и потребляет SSE-стрим событий.
 * Каждый этап пайплайна прилетает live → Engine Room показывает
 * работу архитектуры в реальном времени.
 */
export function useScan() {
  const abortRef = useRef<AbortController | null>(null);

  const startScan = useCallback(async (email: string) => {
    const s = useExperience.getState();
    s.reset();
    s.setEmail(email);
    s.setPhase("engine");

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        useExperience.getState().setError(data?.error ?? "Scan failed to start");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const event = JSON.parse(line.slice(5)) as ScanEvent;
            handleEvent(event);
          } catch {
            // partial json — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        useExperience.getState().setError("Network error. Try again.");
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { startScan, cancel };
}

function handleEvent(event: ScanEvent) {
  const s = useExperience.getState();
  switch (event.type) {
    case "stage":
      s.setStage(event.stage, event.message);
      if (event.stage === "done") s.setPhase("manifest");
      break;
    case "engine":
      s.addEngine({
        engine: event.engine,
        status: event.status,
        count: event.count,
        ms: event.ms,
      });
      break;
    case "breach":
      s.addBreach(event.breach);
      break;
    case "trace":
      s.addTrace(event.trace);
      break;
    case "actions":
      s.setActions(event.actions);
      break;
    case "result":
      s.setResult(event.result);
      break;
    case "narrative":
      s.appendNarrative(event.text);
      break;
    case "error":
      s.setError(event.message);
      break;
  }
}

/**
 * Отдельный фоновый канал: стримит AI-нарратив, пока юзер
 * уже крутит свою тень. Вызывается при входе в manifest.
 */
export async function streamNarrative(): Promise<void> {
  const { breaches, narrativeDone, narrative } = useExperience.getState();
  if (!breaches.length || narrativeDone || narrative) return;

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ breaches }),
    });
    if (!res.ok || !res.body) {
      useExperience.getState().setNarrativeDone();
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      useExperience.getState().appendNarrative(decoder.decode(value, { stream: true }));
    }
  } catch {
    // AI недоступен — детерминированные actions уже на месте
  } finally {
    useExperience.getState().setNarrativeDone();
  }
}
