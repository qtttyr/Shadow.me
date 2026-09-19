"use client";

import { useExperience } from "@/store/experience";
import { useShallow } from "zustand/react/shallow";

/**
 * Живой Blueprint в демо: реальные данные, показанные как паспорт.
 */
export default function DemoBlueprintLive({ progress }: { progress: number }) {
  const { result, narrative } = useExperience(
    useShallow((s) => ({ result: s.result, narrative: s.narrative }))
  );

  if (!result) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-canvas">
        <span className="mono-label text-ink/40">rendering blueprint…</span>
      </div>
    );
  }

  const { stats } = result;

  return (
    <div className="absolute inset-0 bg-canvas px-6 py-8 md:px-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="mono-label text-ink/40">shadow.me / blueprint</span>
            <h1 className="headline text-4xl md:text-5xl text-ink mt-2">Digital passport</h1>
          </div>
          <div className="text-right">
            <span className="mono-label text-ink/40 block">subject</span>
            <span className="font-mono text-xs text-ink/60">test@example.com</span>
          </div>
        </div>

        <div className="rule" />

        {/* score */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10">
          <div className="bg-canvas p-4">
            <span className="mono-label text-ink/40">shadow mass</span>
            <span className="headline block text-4xl text-bordeaux mt-2 tabular-nums">
              {stats.shadowScore}
            </span>
          </div>
          <div className="bg-canvas p-4">
            <span className="mono-label text-ink/40">exposures</span>
            <span className="headline block text-4xl text-ink mt-2 tabular-nums">
              {stats.totalBreaches}
            </span>
          </div>
          <div className="bg-canvas p-4">
            <span className="mono-label text-ink/40">critical</span>
            <span className="headline block text-4xl text-ruby mt-2 tabular-nums">
              {stats.critical}
            </span>
          </div>
          <div className="bg-canvas p-4">
            <span className="mono-label text-ink/40">since</span>
            <span className="headline block text-4xl text-olive mt-2 tabular-nums">
              {stats.firstExposure ?? "—"}
            </span>
          </div>
        </div>

        {/* narrative */}
        {narrative && (
          <div className="max-w-2xl">
            <span className="mono-label text-ink/40">interpretation</span>
            <p className="font-mono text-sm leading-relaxed text-ink/85 mt-2">
              {narrative}
            </p>
          </div>
        )}

        {/* top wounds */}
        <div>
          <span className="mono-label text-ink/40">deepest wounds</span>
          <div className="mt-3 space-y-2">
            {result.breaches.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between font-mono text-sm"
                style={{ opacity: progress > 0.3 ? 1 : 0 }}
              >
                <span className="text-ink/60">{b.year ?? "????"}</span>
                <span className="text-ink font-bold">{b.name}</span>
                <span className="text-bordeaux tabular-nums">{b.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="max-w-2xl">
          <span className="mono-label text-ink/40">cleanup path</span>
          <ol className="mt-3 space-y-2 font-mono text-sm text-ink/85">
            {result.aiActions.slice(0, 3).map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-ruby">{String(i + 1).padStart(2, "0")}</span>
                {a}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
