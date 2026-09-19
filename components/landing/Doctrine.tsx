"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LINES = [
  { big: "You leak.", small: "every signup. every app. every year." },
  { big: "It stays.", small: "sold, copied, traded — forever." },
  { big: "We show it.", small: "three engines. one living shadow." },
];

/**
 * Доктрина: три удара текста, каждый въезжает при скролле.
 */
export default function Doctrine() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".doctrine-line").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 60, skewY: 2 },
          {
            opacity: 1,
            y: 0,
            skewY: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 82%" },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="px-6 md:px-12 py-28 md:py-40 space-y-24">
      {LINES.map((l, i) => (
        <div
          key={i}
          className={`doctrine-line ${i % 2 === 1 ? "text-right" : ""}`}
        >
          <h2 className="headline text-ink text-[clamp(2.6rem,9vw,7.5rem)]">
            {l.big.split(" ").map((w, j) =>
              w === "leak." || w === "stays." ? (
                <span key={j} className="text-ruby">
                  {w}{" "}
                </span>
              ) : (
                <span key={j}>{w} </span>
              )
            )}
          </h2>
          <p className="font-mono text-sm text-ink/50 mt-3">{l.small}</p>
        </div>
      ))}
    </section>
  );
}
