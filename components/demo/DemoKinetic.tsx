"use client";

/**
 * Кинетическая типографика для демо-фильма. Без звука, без диммеров —
 * жёсткие кат-ты, всё аудио накладывается на монтаже.
 */
export default function DemoKinetic({ id, progress }: { id: string; progress: number }) {
  const fade = (p: number, at: number, len = 0.15) =>
    Math.min(1, Math.max(0, (p - at) / len));

  const renderScene = () => {
    switch (id) {
      case "hook":
        return (
          <div className="text-center space-y-4 md:space-y-6 px-4">
            <h1
              className="headline text-ink text-[clamp(2.2rem,9vw,6.5rem)] leading-[0.9] tabular-nums"
              style={{ opacity: fade(progress, 0) }}
            >
              16,000,000,000
            </h1>
            <p
              className="font-mono text-base md:text-lg text-ink/60"
              style={{ opacity: fade(progress, 0.25) }}
            >
              passwords leaked in 2024 alone.
            </p>
            <p
              className="font-mono text-lg md:text-xl text-ruby"
              style={{ opacity: fade(progress, 0.55) }}
            >
              yours is probably one of them.
            </p>
          </div>
        );

      case "problem":
        return (
          <div className="text-center space-y-4 md:space-y-6">
            {["you leak.", "it stays.", "you never see it."].map((line, i) => (
              <p
                key={line}
                className="headline text-ink text-[clamp(2rem,7vw,4.5rem)] leading-tight"
                style={{
                  opacity: fade(progress, i * 0.28),
                  transform: `translateY(${(1 - fade(progress, i * 0.28)) * 24}px)`,
                }}
              >
                {line}
              </p>
            ))}
            <p
              className="font-mono text-sm text-ink/50 mt-6"
              style={{ opacity: fade(progress, 0.85) }}
            >
              breaches are invisible until it&apos;s too late.
            </p>
          </div>
        );

      case "intro":
        return (
          <div className="text-center space-y-4 md:space-y-6 px-4">
            <span className="mono-label text-ink/40 block" style={{ opacity: fade(progress, 0) }}>
              introducing
            </span>
            <h1
              className="headline text-[clamp(2.8rem,13vw,9rem)] leading-[0.82]"
              style={{ opacity: fade(progress, 0.1) }}
            >
              <span className="text-bordeaux">SHADOW</span>
              <span className="text-ink">.me</span>
            </h1>
            <p
              className="font-mono text-base md:text-lg text-ink/60"
              style={{ opacity: fade(progress, 0.5) }}
            >
              visualizing the invisible. cleaning the unseen.
            </p>
          </div>
        );

      case "shadow":
        // текст поверх живого 3D-организма
        return (
          <div className="pointer-events-none text-center space-y-3 md:space-y-5 px-4">
            <span
              className="mono-label text-ink/40 block"
              style={{ opacity: fade(progress, 0) }}
            >
              your data becomes
            </span>
            <h2
              className="headline text-bordeaux text-[clamp(2rem,8vw,5rem)] leading-tight"
              style={{ opacity: fade(progress, 0.12) }}
            >
              a living organism
            </h2>
            <div
              className="flex flex-wrap justify-center gap-4 md:gap-8 font-mono text-xs md:text-sm"
              style={{ opacity: fade(progress, 0.45) }}
            >
              <span className="text-olive">● olive — safe</span>
              <span className="text-sand-deep">● amber — warning</span>
              <span className="text-ruby">● ruby — critical</span>
            </div>
            <p
              className="font-mono text-xs text-ink/40"
              style={{ opacity: fade(progress, 0.75) }}
            >
              every red cluster is a real breach. cursor pulls it apart.
            </p>
          </div>
        );

      case "collapse":
        // текст поверх настоящего схлопывания
        return (
          <div className="pointer-events-none text-center px-4">
            <h2
              className="headline text-ruby text-[clamp(2.4rem,10vw,7rem)] leading-[0.85]"
              style={{ opacity: fade(progress, 0.05) }}
            >
              [ clean my shadow ]
            </h2>
            <p
              className="font-mono text-sm text-ink/50 mt-4"
              style={{ opacity: fade(progress, 0.5) }}
            >
              14,000 particles. one point. zero traces.
            </p>
          </div>
        );

      case "how":
        return (
          <div className="text-center space-y-3 md:space-y-5 px-4">
            <span className="mono-label text-ink/40 block">how it works</span>
            <div className="space-y-2 md:space-y-3">
              {[
                "two independent breach archives",
                "one deterministic scoring engine",
                "one AI narrator — anonymized",
              ].map((line, i) => (
                <p
                  key={line}
                  className="headline text-ink text-[clamp(1.4rem,4.5vw,2.8rem)] leading-tight"
                  style={{
                    opacity: fade(progress, 0.15 + i * 0.22),
                    transform: `translateX(${(1 - fade(progress, 0.15 + i * 0.22)) * 30}px)`,
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
            <p
              className="font-mono text-xs md:text-sm text-ruby mt-4"
              style={{ opacity: fade(progress, 0.8) }}
            >
              facts from engines. stories from AI. never the reverse.
            </p>
          </div>
        );

      case "privacy":
        return (
          <div className="text-center space-y-4 md:space-y-6 px-4">
            <span className="mono-label text-ink/40">the promise</span>
            <div className="space-y-2">
              {["email hashed", "never stored", "never sent to the model"].map((line, i) => (
                <p
                  key={line}
                  className="headline text-olive text-[clamp(1.8rem,6vw,4rem)] leading-tight"
                  style={{ opacity: fade(progress, 0.1 + i * 0.25) }}
                >
                  {line}
                </p>
              ))}
            </div>
            <p
              className="font-mono text-sm text-ink/50"
              style={{ opacity: fade(progress, 0.75) }}
            >
              your identity stays yours. we only render its shadow.
            </p>
          </div>
        );

      case "why":
        return (
          <div className="max-w-3xl px-6 space-y-4 md:space-y-6">
            <span className="mono-label text-ink/40">why it matters</span>
            <ul className="space-y-3 md:space-y-4 font-mono text-xs md:text-sm text-ink/70">
              {[
                "two independent breach archives — facts, not AI hallucination",
                "deterministic scoring — every point explained in code",
                "AI narrates only what engines proved",
                "email hashed, never stored, never sent to the model",
                "beautiful enough to make people care about security",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3"
                  style={{
                    opacity: fade(progress, i * 0.16),
                    transform: `translateX(${(1 - fade(progress, i * 0.16)) * 20}px)`,
                  }}
                >
                  <span className="text-ruby">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );

      case "outro":
        return (
          <div className="text-center space-y-4 md:space-y-6 px-4">
            <h1 className="headline text-[clamp(2.6rem,11vw,7.5rem)] leading-[0.85]">
              <span className="text-bordeaux">SHADOW</span>
              <span className="text-ink">.me</span>
            </h1>
            <p className="font-mono text-base md:text-lg text-ink/60">
              see your shadow. clean it.
            </p>
            <a
              href="/experience"
              className="inline-block border border-ink px-6 py-3 mono-label text-ink hover:bg-bordeaux hover:border-bordeaux hover:text-canvas transition-all duration-500 mt-2"
            >
              [ try it live ]
            </a>
            <p className="mono-label text-ink/30 mt-8">shadow.me — hackathon 2026</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-canvas"
      style={{
        opacity: progress < 0.08 ? progress / 0.08 : progress > 0.92 ? (1 - progress) / 0.08 : 1,
      }}
    >
      {renderScene()}
    </div>
  );
}

