"use client";

import { useState } from "react";
import { audio } from "@/lib/audio/shadowAudio";

/** Минималистичный переключатель звука — правый нижний угол. */
export default function SoundToggle() {
  const [muted, setMuted] = useState(false);

  const toggle = () => {
    audio.unlock();
    const next = !muted;
    audio.setMuted(next);
    setMuted(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute" : "Mute"}
      className="fixed bottom-5 right-5 z-50 no-print group flex items-center gap-2
        border border-ink/20 bg-canvas/70 backdrop-blur-md px-3 py-2
        hover:border-ruby transition-colors duration-300"
    >
      <span className="flex items-end gap-[2px] h-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-[2px] bg-ink/70 transition-all duration-300 ${
              muted ? "h-[3px]" : "pulse-dot"
            }`}
            style={{
              height: muted ? 3 : `${5 + ((i * 4) % 8)}px`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
      <span className="mono-label text-ink/50 group-hover:text-ink">
        {muted ? "sound off" : "sound on"}
      </span>
    </button>
  );
}
