"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const NODES = [
  { name: "XposedOrNot", role: "breach intel", note: "open archive · records · dates · severity" },
  { name: "LeakCheck", role: "cross-check", note: "independent archive — confirms or disputes" },
  { name: "Tavily", role: "web traces", note: "open-web footprint sweep" },
  { name: "Scoring Engine", role: "deterministic", note: "explainable 0–100 risk · code, not vibes" },
  { name: "Gemma via Ollama", role: "interpretation", note: "narrative only — never decides facts" },
];

/**
 * Полоса архитектуры: жюри сразу видит — это НЕ одна модель.
 * Каждый узел — с ролью и ограничением.
 */
export default function EngineStrip() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".engine-node",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
        }
      );
      gsap.fromTo(
        ".engine-wire",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.4,
          ease: "power3.inOut",
          scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="px-6 md:px-12 py-24 md:py-32">
      <span className="mono-label text-ink/40">under the hood — not one model, a pipeline</span>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-px bg-ink/10 border border-ink/10">
        {NODES.map((n, i) => (
          <div key={n.name} className="engine-node bg-canvas p-5 flex flex-col gap-6 min-h-44 justify-between">
            <span className="mono-label text-ruby">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="font-display font-bold uppercase tracking-tight text-ink text-sm md:text-base">
                {n.name}
              </h3>
              <span className="mono-label text-olive-soft block mt-1">{n.role}</span>
              <span className="font-mono text-[11px] text-ink/45 block mt-2">{n.note}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="engine-wire rule mt-10 origin-left" />
      <p className="font-mono text-xs text-ink/45 mt-4 max-w-lg">
        facts come from engines. AI only interprets what they proved. email is hashed, never stored, never sent to the model.
      </p>

      {/* proof block: жюри может проверить самостоятельно */}
      <div className="engine-node mt-8 border border-ink/10 bg-bone/50 p-5 max-w-2xl">
        <span className="mono-label text-ruby">proof, not promises</span>
        <div className="mt-3 grid md:grid-cols-2 gap-4 font-mono text-xs text-ink/60">
          <div>
            <p className="text-ink/80 font-bold">how a check works:</p>
            <p className="mt-1 leading-relaxed">
              when a service is hacked, its database leaks to the dark web. two independent archives catalog those leaks. we check if your email appears in them — and what exactly leaked.
            </p>
          </div>
          <div>
            <p className="text-ink/80 font-bold">verify it yourself:</p>
            <p className="mt-1 leading-relaxed">
              scan <span className="text-ruby">test@example.com</span> — an address burned in hundreds of real breaches. then check it on xposedornot.com. same facts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
