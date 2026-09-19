"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function FooterCTA() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".footer-big",
        { opacity: 0, y: 80 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 70%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative bg-bordeaux text-canvas px-6 md:px-12 py-24 md:py-36 overflow-hidden"
    >
      <span className="mono-label text-canvas/40">final call</span>

      <Link href="/experience" className="footer-big block mt-6 group w-fit">
        <span className="headline text-[clamp(3rem,12vw,10rem)] leading-[0.85] block group-hover:text-ruby transition-colors duration-500">
          Face it.
        </span>
        <span className="headline text-[clamp(3rem,12vw,10rem)] leading-[0.85] block text-canvas/60 group-hover:text-canvas transition-colors duration-500">
          Clean it.
        </span>
      </Link>

      <div className="mt-16 flex flex-col md:flex-row justify-between gap-6 border-t border-canvas/20 pt-6">
        <span className="mono-label text-canvas/40">
          shadow.me — a digital art object
        </span>
        <div className="flex gap-6">
          <Link
            href="/demo"
            className="mono-label text-canvas/60 hover:text-canvas transition-colors duration-300"
          >
            watch demo film →
          </Link>
          <span className="mono-label text-canvas/40">
            no storage · no trace · engines only
          </span>
        </div>
      </div>
    </section>
  );
}
