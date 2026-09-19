"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useExperience } from "@/store/experience";
import Entrance from "@/components/experience/Entrance";
import EngineRoom from "@/components/experience/EngineRoom";
import Manifest from "@/components/experience/Manifest";
import Blueprint from "@/components/experience/Blueprint";
import SoundToggle from "@/components/ui/SoundToggle";

const ShadowScene = dynamic(
  () => import("@/components/experience/ShadowScene"),
  { ssr: false }
);

/**
 * /experience — бесшовный флоу со скролл-переходами:
 * entrance → engine room → manifestation (scroll-descend 320vh)
 * → collapse → blueprint
 */
export default function ExperiencePage() {
  const phase = useExperience((s) => s.phase);
  const result = useExperience((s) => s.result);

  // прямой заход без данных → entrance
  useEffect(() => {
    if (phase !== "entrance" && !result && phase !== "engine") {
      useExperience.getState().reset();
    }
  }, [phase, result]);

  // при смене фазы сбрасываем скролл
  useEffect(() => {
    if (phase === "entrance" || phase === "engine" || phase === "blueprint") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [phase]);

  const showScene = phase === "manifest" || phase === "collapse";

  return (
    <main className="relative min-h-dvh">
      {showScene && <ShadowScene />}

      {phase === "entrance" && <Entrance />}
      {phase === "engine" && <EngineRoom />}
      {(phase === "manifest" || phase === "collapse") && <Manifest />}
      {phase === "blueprint" && <Blueprint />}

      <SoundToggle />
    </main>
  );
}
