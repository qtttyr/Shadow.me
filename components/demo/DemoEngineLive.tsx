"use client";

import { useEffect, useRef } from "react";
import { useExperience } from "@/store/experience";
import { useShallow } from "zustand/react/shallow";

/**
 * Живой Engine Room в демо: реальные данные из сканирования test@example.com,
 * показанные как «рентген» архитектуры.
 */
export default function DemoEngineLive({ progress }: { progress: number }) {
  const { engines, breaches, stage } = useExperience(
    useShallow((s) => ({
      engines: s.engines,
      breaches: s.breaches,
      stage: s.stage,
    }))
  );
  const counterRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(0);

  // анимация счётчика: поднимаем до реального числа
  useEffect(() => {
    if (!counterRef.current) return;
    const target = Math.min(breaches.length, Math.floor(progress * 300));
    if (target !== shownRef.current) {
      shownRef.current = target;
      counterRef.current.textContent = String(target).padStart(3, "0");
    }
  }, [breaches.length, progress]);

  const ENGINE_LABEL: Record<string, string> = {
    xposedornot: "XposedOrNot",
    leakcheck: "LeakCheck",
    tavily: "Tavily",
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-canvas px-6 py-8 md:px-12">
      {/* top */}
      <div className="flex items-center justify-between">
        <span className="mono-label text-ink/50">engine room — live</span>
        <span className="mono-label flex items-center gap-2 text-olive">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-olive pulse-dot" />
          {stage}
        </span>
      </div>

      {/* center: counter */}
      <div className="flex flex-col items-center gap-4">
        <span
          ref={counterRef}
          className="headline text-ink text-[clamp(4rem,18vw,11rem)] tabular-nums"
        >
          000
        </span>
        <span className="mono-label text-ink/40">exposures detected</span>
      </div>

      {/* engines */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-ink/10">
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
      </div>
    </div>
  );
}
