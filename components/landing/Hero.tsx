"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

/**
 * НЕ hero-секция. Разворот манифеста.
 * SHADOW — сдвинут, сломан, живой. Текст — минимум, смысл — максимум.
 */
export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const meRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // появление: слова въезжают с разных сторон
      gsap.fromTo(
        shadowRef.current,
        { xPercent: -8, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 1.6, ease: "power4.out", delay: 0.2 }
      );
      gsap.fromTo(
        meRef.current,
        { xPercent: 10, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 1.6, ease: "power4.out", delay: 0.45 }
      );
      gsap.fromTo(
        ".hero-fade",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: "power2.out", delay: 0.9 }
      );

      // параллакс за мышью
      const onMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(shadowRef.current, { x: x * -18, y: y * -10, duration: 1.2, ease: "power2.out" });
        gsap.to(meRef.current, { x: x * 14, y: y * 8, duration: 1.2, ease: "power2.out" });
      };
      window.addEventListener("mousemove", onMove);
      return () => window.removeEventListener("mousemove", onMove);
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative min-h-dvh flex flex-col justify-between px-6 py-8 md:px-12 overflow-hidden"
    >
      {/* top row */}
      <div className="hero-fade flex items-center justify-between">
        <span className="mono-label text-ink/50">n°01 — the entrance</span>
        <span className="mono-label text-ink/50 hidden md:block">
          visualizing the invisible
        </span>
      </div>

      {/* broken headline */}
      <div className="relative flex-1 flex flex-col justify-center">
        <span
          ref={shadowRef}
          className="headline block text-bordeaux text-[clamp(4.5rem,17vw,13rem)] leading-[0.8] -ml-2 md:-ml-4"
        >
          Shadow
        </span>
        <span
          ref={meRef}
          className="headline block text-ink text-[clamp(2.2rem,8vw,6.2rem)] leading-[0.9] self-end mr-[8vw] -mt-[0.35em] md:-mt-[0.45em]"
        >
          .me
        </span>

        {/* floating meta */}
        <div className="hero-fade absolute right-0 top-[12%] hidden lg:block max-w-[220px] text-right">
          <p className="mono-label text-ink/40 leading-relaxed">
            every account you ever made left a mark. we render it.
          </p>
        </div>
        <div className="hero-fade absolute left-0 bottom-[18%] hidden lg:block max-w-[200px]">
          <p className="mono-label text-olive-soft leading-relaxed">
            multi-engine exposure scan → living organism
          </p>
        </div>
      </div>

      {/* bottom CTA strip */}
      <div className="hero-fade flex flex-col md:flex-row md:items-end justify-between gap-8">
        <p className="font-mono text-sm text-ink/60 max-w-sm leading-relaxed">
          See what the internet kept about you — then take it back.
        </p>
        <Link
          href="/experience"
          className="group relative inline-flex items-center gap-4 border border-ink px-8 py-4 mono-label text-ink overflow-hidden"
        >
          <span className="absolute inset-0 bg-bordeaux translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <span className="relative group-hover:text-canvas transition-colors duration-500">
            enter your shadow
          </span>
          <span className="relative group-hover:text-canvas transition-all duration-500 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
