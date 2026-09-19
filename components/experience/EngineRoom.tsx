"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useExperience } from "@/store/experience";
import { useShallow } from "zustand/react/shallow";

const PIPELINE = [
  { id: "validating", label: "VALIDATE" },
  { id: "querying", label: "ENGINES" },
  { id: "merging", label: "MERGE" },
  { id: "scoring", label: "SCORE" },
  { id: "web_traces", label: "WEB TRACE" },
  { id: "done", label: "MANIFEST" },
] as const;

const ENGINE_LABEL: Record<string, string> = {
  xposedornot: "XposedOrNot",
  leakcheck: "LeakCheck",
  tavily: "Tavily",
};

/**
 * Этап 1.5: Engine Room.
 * Живой рентген архитектуры: жюри видит КАЖДЫЙ узел пайплайна,
 * а не «одну модель, которая врёт».
 */
export default function EngineRoom() {
  const { stage, stageMessage, engines, breaches, error, result } =
    useExperience(
      useShallow((s) => ({
        stage: s.stage,
        stageMessage: s.stageMessage,
        engines: s.engines,
        breaches: s.breaches,
        error: s.error,
        result: s.result,
      }))
    );
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const activeIdx = Math.max(
    0,
    PIPELINE.findIndex((p) => p.id === stage)
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".engine-el",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (counterRef.current) {
      counterRef.current.textContent = String(breaches.length).padStart(3, "0");
    }
  }, [breaches.length]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-10 flex flex-col justify-between bg-canvas px-6 py-8 md:px-12 md:py-10"
    >
      {/* top bar */}
      <div className="engine-el flex items-center justify-between">
        <span className="mono-label text-ink/50">shadow.me / engine room</span>
        <span className="mono-label flex items-center gap-2 text-olive">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-olive pulse-dot" />
          live
        </span>
      </div>

      {/* pipeline strip */}
      <div className="engine-el">
        <div className="flex items-center gap-0 overflow-x-auto">
          {PIPELINE.map((p, i) => {
            const state =
              i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
            return (
              <div key={p.id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center gap-2 px-1">
                  <span
                    className={`mono-label transition-colors duration-500 ${
                      state === "active"
                        ? "text-ruby"
                        : state === "done"
                          ? "text-olive"
                          : "text-ink/25"
                    }`}
                  >
                    {p.label}
                  </span>
                  <span
                    className={`block h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                      state === "active"
                        ? "bg-ruby pulse-dot"
                        : state === "done"
                          ? "bg-olive"
                          : "bg-ink/15"
                    }`}
                  />
                </div>
                {i < PIPELINE.length - 1 && (
                  <div
                    className={`h-px w-8 md:w-16 transition-colors duration-700 ${
                      i < activeIdx ? "bg-olive" : "bg-ink/15"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* center: counter + status */}
      <div className="engine-el flex flex-col items-center gap-6 text-center">
        <span
          ref={counterRef}
          className="headline text-ink text-[clamp(4rem,18vw,11rem)] tabular-nums"
        >
          000
        </span>
        <span className="mono-label text-ink/40">exposures detected</span>
        <p className="font-mono text-sm text-olive max-w-md">
          {error ? (
            <span className="text-ruby">{error}</span>
          ) : (
            stageMessage || "Initializing…"
          )}
        </p>
      </div>

      {/* engine readouts */}
      <div className="engine-el grid grid-cols-2 md:grid-cols-3 gap-px bg-ink/10">
        {engines.map((e) => (
          <div key={e.engine} className="bg-canvas p-4 flex flex-col gap-1">
            <span className="mono-label text-ink/50">
              {ENGINE_LABEL[e.engine] ?? e.engine}
            </span>
            <span
              className={`font-mono text-sm ${
                e.status === "ok"
                  ? "text-ink"
                  : e.status === "empty"
                    ? "text-olive-soft"
                    : "text-ruby"
              }`}
            >
              {e.status === "ok"
                ? `${e.count} found`
                : e.status === "empty"
                  ? "clean"
                  : "unreachable"}
              <span className="text-ink/30"> · {e.ms}ms</span>
            </span>
          </div>
        ))}
        <div className="bg-canvas p-4 flex items-center justify-between">
          <span className="mono-label text-ink/40">shadow mass</span>
          <span className="font-mono text-sm text-bordeaux tabular-nums">
            {result?.stats.shadowScore ?? "…"}
          </span>
        </div>
      </div>
    </div>
  );
}
