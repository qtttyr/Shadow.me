"use client";

import { useExperience } from "@/store/experience";
import type { Breach } from "@/lib/types";

/**
 * Сцена «как думает скоринг»: берём РЕАЛЬНУЮ утечку из живого скана
 * и показываем, как веса собираются в финальный балл.
 * Объяснимость в действии — не карточка, а сборка.
 */
export default function DemoScoring({ progress }: { progress: number }) {
  const result = useExperience((s) => s.result);

  // берём самую тяжёлую реальную утечку, иначе — пример
  const breach: Breach =
    result?.breaches.find((b) => b.level === "CRITICAL") ?? {
      id: "demo",
      name: "LinkedIn",
      domain: "linkedin.com",
      date: "2021",
      year: 2021,
      categories: ["passwords", "emails", "phones"],
      recordsExposed: 700_000_000,
      passwordRisk: "plaintext",
      description: null,
      industry: "Social",
      sources: [{ engine: "xposedornot" }, { engine: "leakcheck" }],
      score: 0,
      level: "CRITICAL",
      reasons: [],
    };

  // воспроизводим логику scoring визуально
  const WEIGHTS = [
    { label: "passwords exposed", pts: 30, show: breach.categories.includes("passwords") },
    { label: "phone number exposed", pts: 16, show: breach.categories.includes("phones") },
    { label: "plaintext storage", pts: 25, show: breach.passwordRisk === "plaintext" },
    { label: "recent breach", pts: 14, show: !!breach.year && 2026 - breach.year <= 3 },
    { label: `${breach.recordsExposed ? Math.round(breach.recordsExposed / 1e6) + "M records" : "massive scale"}`, pts: 10, show: (breach.recordsExposed ?? 0) >= 10_000_000 },
    { label: "cross-confirmed ×2 engines", pts: 8, show: breach.sources.length >= 2 },
  ].filter((w) => w.show);

  const total = Math.min(100, WEIGHTS.reduce((a, w) => a + w.pts, 0));
  const shownCount = Math.floor(progress * 1.4 * WEIGHTS.length);
  const shownTotal = WEIGHTS.slice(0, shownCount).reduce((a, w) => a + w.pts, 0);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-3xl">
        <span className="mono-label text-ink/40">how the score is born — deterministic, explainable</span>

        {/* имя утечки */}
        <h2 className="headline text-ink text-[clamp(2rem,7vw,4.5rem)] mt-4 leading-tight">
          {breach.name}
          <span className="text-ink/30"> · {breach.year ?? "????"}</span>
        </h2>

        {/* веса собираются */}
        <div className="mt-8 space-y-3">
          {WEIGHTS.map((w, i) => {
            const visible = i < shownCount;
            return (
              <div
                key={w.label}
                className="flex items-center gap-4 transition-all duration-500"
                style={{
                  opacity: visible ? 1 : 0.15,
                  transform: visible ? "translateX(0)" : "translateX(24px)",
                }}
              >
                <span className="font-mono text-sm text-ruby w-10 text-right tabular-nums">
                  +{w.pts}
                </span>
                <div className="flex-1 h-6 bg-ink/5 relative overflow-hidden">
                  <div
                    className="h-full bg-ruby/80 transition-all duration-700 ease-out"
                    style={{ width: visible ? `${w.pts * 2}%` : "0%" }}
                  />
                </div>
                <span className="font-mono text-xs text-ink/60 w-56">{w.label}</span>
              </div>
            );
          })}
        </div>

        {/* итог */}
        <div className="mt-10 flex items-baseline gap-4">
          <span className="mono-label text-ink/40">risk score</span>
          <span className="headline text-6xl md:text-8xl text-bordeaux tabular-nums">
            {shownTotal}
          </span>
          <span className="font-mono text-sm text-ink/40">/100</span>
          <span
            className="mono-label ml-4 transition-opacity duration-500"
            style={{ opacity: shownTotal >= 55 ? 1 : 0 }}
          >
            <span className="text-ruby">■</span> critical
          </span>
        </div>

        <p
          className="font-mono text-xs text-ink/40 mt-6 transition-opacity duration-700"
          style={{ opacity: progress > 0.8 ? 1 : 0 }}
        >
          no AI guessed this. every point has a reason. every reason is code.
        </p>
      </div>
    </div>
  );
}
