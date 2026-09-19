"use client";

import { useExperience } from "@/store/experience";

/**
 * Стеклянная карточка раны: появляется рядом с курсором,
 * показывает объяснимый скоринг (reasons) — доказательство логики.
 */
export default function BreachCard() {
  const breach = useExperience((s) => s.hoveredBreach);

  return (
    <div
      className={`pointer-events-none fixed z-30 left-1/2 bottom-40 -translate-x-1/2 w-[min(92vw,380px)]
        transition-all duration-500 ease-out
        ${breach ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {breach && (
        <div className="border border-ink/15 bg-canvas/70 backdrop-blur-xl p-5 shadow-[0_24px_60px_-20px_rgba(28,29,22,0.35)]">
          <div className="flex items-baseline justify-between gap-4">
            <span className="mono-label text-ink/40">
              {breach.year ?? "unknown"} · {breach.sources.length} engine
              {breach.sources.length > 1 ? "s" : ""}
            </span>
            <span
              className={`mono-label ${
                breach.level === "CRITICAL" ? "text-ruby" : "text-sand-deep"
              }`}
            >
              {breach.level}
            </span>
          </div>

          <h3 className="headline text-2xl mt-2 text-ink">{breach.name}</h3>

          <div className="rule my-3" />

          <div className="flex items-baseline justify-between">
            <span className="mono-label text-ink/40">risk score</span>
            <span className="font-mono text-xl text-bordeaux tabular-nums">
              {breach.score}
              <span className="text-ink/30 text-xs">/100</span>
            </span>
          </div>

          <ul className="mt-3 space-y-1">
            {breach.reasons.slice(0, 3).map((r) => (
              <li key={r} className="font-mono text-xs text-ink/70 flex gap-2">
                <span className="text-ruby">×</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
