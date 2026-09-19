"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useScan } from "@/hooks/useScan";
import { audio } from "@/lib/audio/shadowAudio";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Этап 1: The Entrance.
 * Пустой холст. Одна линия. Один инпут. При сабмите — «ныряние».
 */
export default function Entrance() {
  const [email, setEmail] = useState("");
  const [diving, setDiving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const { startScan } = useScan();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".entrance-el",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: "power3.out", delay: 0.3 }
      );
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.6, ease: "power4.inOut", delay: 0.6 }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean) || diving) return;
    setDiving(true);

    // ВАЖНО: unlock ДОЛЖЕН быть в момент жеста — браузер иначе мьютит AudioContext
    audio.unlock();
    audio.dive();

    // «ныряние»: текст растворяется, экран проваливается
    const ctx = gsap.context(() => {
      gsap.to(".entrance-el", {
        opacity: 0,
        filter: "blur(14px)",
        scale: 0.96,
        duration: 0.9,
        stagger: 0.05,
        ease: "power2.in",
      });
      gsap.to(rootRef.current, {
        scale: 2.4,
        opacity: 0,
        duration: 1.1,
        ease: "power3.in",
        onComplete: () => startScan(clean),
      });
    }, rootRef);
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-canvas px-6"
    >
      <p className="entrance-el mono-label text-olive-soft mb-10">
        Your data is your shadow
      </p>

      <h1 className="entrance-el headline text-ink text-center text-[clamp(2.6rem,9vw,7rem)]">
        Meet your
        <br />
        <span className="text-bordeaux">shadow.</span>
      </h1>

      <div
        ref={lineRef}
        className="entrance-el rule w-full max-w-xl my-12 origin-center"
      />

      <form onSubmit={submit} className="entrance-el w-full max-w-xl">
        <div className="flex items-baseline gap-4 border-b border-ink/25 pb-3 focus-within:border-ruby transition-colors duration-500">
          <span className="mono-label text-ink/40 shrink-0">email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@somewhere.com"
            autoFocus
            spellCheck={false}
            className="w-full bg-transparent font-mono text-lg md:text-xl text-ink placeholder:text-ink/25 outline-none"
          />
          <button
            type="submit"
            disabled={!EMAIL_RE.test(email.trim())}
            className="mono-label shrink-0 text-ruby disabled:text-ink/20 transition-colors duration-300 hover:tracking-[0.3em]"
          >
            [ dive ]
          </button>
        </div>
      </form>

      <p className="entrance-el mono-label text-ink/30 mt-12 text-center">
        no storage · no trace · engines only
      </p>

      {/* witness: доказательство для скептиков */}
      <button
        type="button"
        onClick={() => setEmail("test@example.com")}
        className="entrance-el mono-label mt-6 text-ink/35 hover:text-ruby transition-colors duration-300"
      >
        clean inbox? witness a real shadow → test@example.com
      </button>
    </div>
  );
}
