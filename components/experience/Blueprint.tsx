"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useExperience } from "@/store/experience";
import { useShallow } from "zustand/react/shallow";
import { exportBlueprintPdf } from "@/lib/pdf/blueprint";
import { audio } from "@/lib/audio/shadowAudio";

/**
 * Этап 4: The Blueprint.
 * Цифровой паспорт: архитектурная сетка, нарратив, таймлайн, действия.
 */
export default function Blueprint() {
  const { result, narrative, actions, email, reset } = useExperience(
    useShallow((s) => ({
      result: s.result,
      narrative: s.narrative,
      actions: s.actions,
      email: s.email,
      reset: s.reset,
    }))
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    if (exporting || !result) return;
    setExporting(true);
    audio.unlock();
    audio.print();
    try {
      await exportBlueprintPdf(result, narrative, email);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".bp-el",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.07, ease: "power3.out", delay: 0.4 }
      );
      gsap.fromTo(
        ".bp-bar",
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, stagger: 0.06, ease: "power3.inOut", delay: 0.8 }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  if (!result) return null;
  const { stats, breaches, webTraces } = result;
  const byYear = [...breaches].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  const isClean = stats.totalBreaches === 0;

  // ── чистый паспорт: спокойствие вместо нулей ──
  if (isClean) {
    return (
      <div ref={rootRef} className="min-h-dvh bg-canvas px-6 py-10 md:px-12 lg:px-20 flex flex-col justify-center">
        <header className="bp-el">
          <span className="mono-label text-ink/40">shadow.me / blueprint</span>
          <h1 className="headline text-[clamp(3rem,10vw,7rem)] text-olive mt-4 leading-[0.85]">
            Clean.
          </h1>
        </header>

        <div className="rule my-10" />

        <div className="bp-el max-w-lg">
          <p className="font-mono text-sm leading-relaxed text-ink/70">
            Subject <span className="text-ink">{email}</span> carries no shadow.
            Two engines scanned breach intelligence archives and found zero exposures.
          </p>
          <p className="font-mono text-sm leading-relaxed text-olive mt-4">
            Your digital footprint is intact. Stay small. Stay unseen.
          </p>
        </div>

        <div className="bp-el mt-12 flex flex-wrap gap-4 no-print">
          <button
            onClick={reset}
            className="border border-ink/20 px-8 py-3 mono-label text-ink/50 hover:text-ruby hover:border-ruby transition-all duration-400"
          >
            [ scan another ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="min-h-dvh bg-canvas px-6 py-10 md:px-12 lg:px-20"
    >
      {/* header */}
      <header className="bp-el flex items-start justify-between gap-6">
        <div>
          <span className="mono-label text-ink/40">shadow.me / blueprint</span>
          <h1 className="headline text-[clamp(2.2rem,6vw,4.5rem)] text-ink mt-2">
            Digital passport
          </h1>
        </div>
        <div className="text-right shrink-0">
          <span className="mono-label text-ink/40 block">id</span>
          <span className="font-mono text-xs text-ink/60">{result.id.slice(0, 8)}</span>
          <span className="mono-label text-ink/40 block mt-2">subject</span>
          <span className="font-mono text-xs text-ink/60">{email}</span>
        </div>
      </header>

      <div className="rule my-8" />

      {/* score block */}
      <section className="bp-el grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10">
        <div className="bg-canvas p-6">
          <span className="mono-label text-ink/40">shadow mass</span>
          <span className="headline block text-5xl text-bordeaux mt-2 tabular-nums">
            {stats.shadowScore}
          </span>
        </div>
        <div className="bg-canvas p-6">
          <span className="mono-label text-ink/40">exposures</span>
          <span className="headline block text-5xl text-ink mt-2 tabular-nums">
            {stats.totalBreaches}
          </span>
        </div>
        <div className="bg-canvas p-6">
          <span className="mono-label text-ink/40">critical wounds</span>
          <span className="headline block text-5xl text-ruby mt-2 tabular-nums">
            {stats.critical}
          </span>
        </div>
        <div className="bg-canvas p-6">
          <span className="mono-label text-ink/40">exposed since</span>
          <span className="headline block text-5xl text-olive mt-2 tabular-nums">
            {stats.firstExposure ?? "—"}
          </span>
        </div>
      </section>

      {/* narrative */}
      {narrative && (
        <section className="bp-el mt-10 max-w-2xl">
          <span className="mono-label text-ink/40">interpretation</span>
          <p className="font-mono text-sm md:text-base leading-relaxed text-ink/85 mt-3">
            {narrative}
          </p>
        </section>
      )}
      {/* wound ledger */}
      <section className="bp-el mt-12">
        <span className="mono-label text-ink/40">wound ledger</span>
        <div className="mt-4 border-t border-ink/15">
          {byYear.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[80px_1fr_1fr_120px] items-baseline gap-4 py-3 border-b border-ink/10"
            >
              <span className="font-mono text-sm text-ink/50 tabular-nums">
                {b.year ?? "????"}
              </span>
              <span className="font-display font-bold uppercase tracking-tight text-ink truncate">
                {b.name}
              </span>
              <span className="hidden md:block font-mono text-xs text-ink/50 truncate">
                {b.categories.slice(0, 3).join(" · ")}
              </span>
              <span className="flex items-center gap-2 justify-self-end">
                <span className="font-mono text-sm text-bordeaux tabular-nums w-8 text-right">
                  {b.score}
                </span>
                <span className="h-1 w-16 bg-ink/10 overflow-hidden">
                  <span
                    className={`bp-bar block h-full origin-left ${
                      b.level === "CRITICAL"
                        ? "bg-ruby"
                        : b.level === "WARNING"
                          ? "bg-sand-deep"
                          : "bg-olive"
                    }`}
                    style={{ width: `${b.score}%` }}
                  />
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* web traces */}
      {webTraces.length > 0 && (
        <section className="bp-el mt-12">
          <span className="mono-label text-ink/40">open-web traces</span>
          <div className="mt-4 grid md:grid-cols-2 gap-px bg-ink/10">
            {webTraces.map((t) => (
              <a
                key={t.url}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-canvas p-4 group hover:bg-bone transition-colors"
              >
                <span className="font-mono text-xs text-ruby group-hover:underline truncate block">
                  {t.url}
                </span>
                <span className="font-mono text-xs text-ink/60 mt-1 line-clamp-2 block">
                  {t.snippet}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* actions */}
      <section className="bp-el mt-12 max-w-2xl">
        <span className="mono-label text-ink/40">the cleanup path</span>
        <ol className="mt-4 space-y-3">
          {actions.map((a, i) => (
            <li key={i} className="flex gap-4 items-baseline">
              <span className="font-mono text-xs text-ruby shrink-0 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-sm text-ink/85">{a}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* footer actions */}
      <footer className="bp-el no-print mt-14 flex flex-wrap gap-4">
        <button
          onClick={onExport}
          disabled={exporting}
          className="border border-ink/60 px-8 py-3 mono-label text-ink hover:bg-ink hover:text-canvas transition-all duration-400 disabled:opacity-50"
        >
          {exporting ? "[ rendering… ]" : "[ export blueprint ]"}
        </button>
        <button
          onClick={reset}
          className="border border-ink/20 px-8 py-3 mono-label text-ink/50 hover:text-ruby hover:border-ruby transition-all duration-400"
        >
          [ scan another ]
        </button>
      </footer>
    </div>
  );
}

