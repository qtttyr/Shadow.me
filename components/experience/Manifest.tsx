"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useExperience } from "@/store/experience";
import { useShallow } from "zustand/react/shallow";
import { streamNarrative } from "@/hooks/useScan";
import BreachCard from "./BreachCard";

gsap.registerPlugin(ScrollTrigger);

/**
 * Этап 2: The Manifestation — теперь со скролл-путешествием.
 * 320vh спуск: камера ныряет в тень, организм ускоряется,
 * HUD перетекает в инструкцию, внизу — порог очищения.
 */
export default function Manifest() {
  const { result, narrative, narrativeDone, setPhase } = useExperience(
    useShallow((s) => ({
      result: s.result,
      narrative: s.narrative,
      narrativeDone: s.narrativeDone,
      setPhase: s.setPhase,
    }))
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const narrativeStarted = useRef(false);
  const stRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".manifest-el",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power3.out", delay: 1.4 }
      );

      // ── скролл-путешествие вглубь тени ──
      stRef.current = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          useExperience.getState().setScrollProgress(p);

          // HUD: верхний блок уходит, средний приходит, порог нарастает
          gsap.set(".hud-top", { opacity: 1 - Math.min(1, p * 2.2), y: -p * 60 });
          gsap.set(".hud-stats", { opacity: 1 - Math.min(1, p * 2.2), y: -p * 40 });
          gsap.set(".hud-narrative", {
            opacity: p > 0.25 && p < 0.85 ? 1 : Math.min(p * 4, Math.max(0, (1 - p) * 4)),
            y: (0.5 - p) * 30,
          });
          gsap.set(".hud-depth", { opacity: Math.min(1, p * 3) });
          gsap.set(".hud-clean", { opacity: Math.max(0, (p - 0.72) * 3.6), y: (1 - p) * 24 });
        },
      });
    }, rootRef);

    if (!narrativeStarted.current) {
      narrativeStarted.current = true;
      streamNarrative();
    }
    return () => {
      stRef.current?.kill();
      useExperience.getState().setScrollProgress(0);
      ctx.revert();
    };
  }, []);

  if (!result) return null;
  const { stats } = result;
  const isClean = stats.totalBreaches === 0;

  const clean = () => setPhase("collapse");

  // ── чистая тень: минималистичное состояние покоя ──
  if (isClean) {
    return (
      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <span className="mono-label text-olive/60 mb-6">the manifestation</span>
        <h1 className="headline text-[clamp(3rem,12vw,9rem)] text-olive leading-[0.85]">
          No shadow
          <br />
          found.
        </h1>
        <p className="font-mono text-sm text-ink/50 mt-8 max-w-sm leading-relaxed">
          Two engines. Zero exposures. Your shadow never formed — keep it that way.
        </p>

        {/* честность: чистота проверяема */}
        <div className="font-mono text-[11px] text-ink/35 mt-6 space-y-1">
          <p>verify independently:</p>
          <a
            href="https://xposedornot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:text-olive underline decoration-ink/20 pointer-events-auto"
          >
            xposedornot.com — enter the same email
          </a>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4 pointer-events-auto">
          <button
            onClick={() => useExperience.getState().setPhase("blueprint")}
            className="border border-olive/50 px-8 py-3 mono-label text-olive hover:bg-olive hover:text-canvas transition-all duration-400"
          >
            [ view passport ]
          </button>
          <button
            onClick={() => useExperience.getState().reset()}
            className="border border-ink/20 px-8 py-3 mono-label text-ink/50 hover:text-ruby hover:border-ruby transition-all duration-400"
          >
            [ scan another ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="pointer-events-none relative z-10" style={{ height: "320vh" }}>
      {/* HUD — прибит к вьюпорту на всём спуске */}
      <div className="pointer-events-none sticky top-0 h-dvh flex flex-col justify-between px-6 py-8 md:px-12 md:py-10">
        {/* top */}
        <div className="hud-top manifest-el flex items-center justify-between">
          <span className="mono-label text-ink/50">the manifestation</span>
          <span className="mono-label text-ink/50">
            {stats.enginesUsed.length} engines · {stats.durationMs}ms
          </span>
        </div>

        {/* left column: stats */}
        <div className="hud-stats manifest-el max-w-xs space-y-6">
          <div>
            <span className="mono-label text-ink/40">shadow mass</span>
            <div className="headline text-[clamp(3rem,8vw,6rem)] text-bordeaux tabular-nums leading-none mt-1">
              {stats.shadowScore}
            </div>
          </div>
          <div className="flex gap-8">
            <div>
              <span className="font-mono text-2xl text-ruby tabular-nums">{stats.critical}</span>
              <span className="mono-label block text-ink/40 mt-1">critical</span>
            </div>
            <div>
              <span className="font-mono text-2xl text-sand-deep tabular-nums">{stats.warning}</span>
              <span className="mono-label block text-ink/40 mt-1">warning</span>
            </div>
            <div>
              <span className="font-mono text-2xl text-olive tabular-nums">{stats.safe}</span>
              <span className="mono-label block text-ink/40 mt-1">low</span>
            </div>
          </div>
          {stats.firstExposure && (
            <p className="mono-label text-ink/40 leading-relaxed">
              shadow grew {stats.firstExposure} → {stats.latestExposure ?? "?"}
            </p>
          )}
        </div>

        {/* middle: narrative + depth cue */}
        <div className="hud-narrative manifest-el self-end max-w-sm text-right">
          <span className="mono-label text-ink/40 block mb-2">
            interpretation layer {narrative ? "" : "· …"}
          </span>
          <p className="font-mono text-sm leading-relaxed text-ink/80 min-h-16">
            {narrative || " "}
            {!narrativeDone && narrative.length > 0 && (
              <span className="text-ruby pulse-dot">▍</span>
            )}
          </p>
        </div>

        <div className="hud-depth manifest-el self-center text-center opacity-0">
          <p className="mono-label text-ink/35">descend</p>
          <span className="block text-ruby text-lg mt-1 animate-bounce">↓</span>
        </div>

        {/* bottom: clean threshold */}
        <div className="hud-clean manifest-el flex justify-center opacity-0">
          <button
            onClick={clean}
            className="pointer-events-auto group relative border border-ink/60 px-10 py-4 mono-label text-ink
              hover:bg-bordeaux hover:border-bordeaux hover:text-canvas
              transition-all duration-500 hover:tracking-[0.35em]"
          >
            [ clean my shadow ]
          </button>
        </div>
      </div>

      <BreachCard />
    </div>
  );
}
