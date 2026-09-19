"use client";

import { useEffect, useRef, useState } from "react";
import { useScan } from "@/hooks/useScan";
import { useExperience } from "@/store/experience";
import { audio } from "@/lib/audio/shadowAudio";
import DemoKinetic from "@/components/demo/DemoKinetic";
import DemoSignalGraph from "@/components/demo/DemoSignalGraph";
import DemoScoring from "@/components/demo/DemoScoring";
import DemoShadowScene from "@/components/demo/DemoShadowScene";
import DemoBlueprintLive from "@/components/demo/DemoBlueprintLive";
import DemoEngineLive from "@/components/demo/DemoEngineLive";

const SCENES = [
  { id: "hook", t: 0, d: 10 },
  { id: "problem", t: 10, d: 14 },
  { id: "intro", t: 24, d: 10 },
  { id: "how", t: 34, d: 14 },
  { id: "graph", t: 48, d: 20 },
  { id: "engine", t: 68, d: 16 },
  { id: "scoring", t: 84, d: 16 },
  { id: "shadow", t: 100, d: 24 },
  { id: "collapse", t: 124, d: 10 },
  { id: "blueprint", t: 134, d: 18 },
  { id: "privacy", t: 152, d: 12 },
  { id: "why", t: 164, d: 16 },
  { id: "outro", t: 180, d: 10 },
];

const TOTAL = 190; // 3:10

export default function DemoPage() {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [scene, setScene] = useState("hook");
  const { startScan } = useScan();
  const startedRef = useRef(false);
  const rafRef = useRef(0);
  const t0Ref = useRef(0);

  // демо-фильм беззвучный — пользователь накладывает свою озвучку
  useEffect(() => {
    audio.setMuted(true);
    return () => audio.setMuted(false);
  }, []);

  // демо-фильм полностью беззвучен — музыку и озвучку накладывает монтажёр
  useEffect(() => {
    audio.setSilent(true);
    return () => audio.setSilent(false);
  }, []);

  useEffect(() => {
    if (!playing) return;

    const tick = () => {
      const elapsed = (performance.now() - t0Ref.current) / 1000;
      setTime(elapsed);

      const current = SCENES.find((s) => elapsed >= s.t && elapsed < s.t + s.d);
      if (current && current.id !== scene) {
        setScene(current.id);
        onSceneEnter(current.id);
      }

      if (elapsed >= TOTAL) {
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const onSceneEnter = (id: string) => {
    if (id === "graph") {
      // запускаем реальный скан в фоне — к сцене shadow данные будут готовы
      if (!startedRef.current) {
        startedRef.current = true;
        startScan("test@example.com");
      }
    }
    if (id === "shadow") {
      useExperience.getState().setPhase("manifest");
    }
    if (id === "collapse") {
      useExperience.getState().setPhase("collapse");
    }
  };

  const play = () => {
    t0Ref.current = performance.now();
    setPlaying(true);
  };

  const currentScene = SCENES.find((s) => s.id === scene) ?? SCENES[0];
  const sceneProgress = Math.min(1, Math.max(0, (time - currentScene.t) / currentScene.d));

  // 3D живёт на сценах shadow + collapse
  const show3D = scene === "shadow" || scene === "collapse";

  return (
    <div className="demo-page fixed inset-0 bg-canvas overflow-hidden select-none">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-ink/10 z-50">
        <div
          className="h-full bg-ruby origin-left"
          style={{ transform: `scaleX(${time / TOTAL})` }}
        />
      </div>

      <div className="absolute top-4 right-4 z-50 mono-label text-ink/30 tabular-nums">
        {Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, "0")} / 3:10
      </div>

      {!playing && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-canvas">
          <span className="mono-label text-ink/40 mb-6">shadow.me — demo film</span>
          <button
            onClick={play}
            className="headline text-[clamp(2.5rem,10vw,7rem)] text-ink hover:text-ruby transition-colors duration-500"
          >
            ▶ play
          </button>
          <span className="mono-label text-ink/30 mt-8">3:10 · sound on</span>
        </div>
      )}

      {playing && (
        <>
          {show3D && <DemoShadowScene progress={sceneProgress} />}

          {scene === "hook" && <DemoKinetic id="hook" progress={sceneProgress} />}
          {scene === "problem" && <DemoKinetic id="problem" progress={sceneProgress} />}
          {scene === "intro" && <DemoKinetic id="intro" progress={sceneProgress} />}
          {scene === "how" && <DemoKinetic id="how" progress={sceneProgress} />}
          {scene === "graph" && <DemoSignalGraph progress={sceneProgress} />}
          {scene === "engine" && <DemoEngineLive progress={sceneProgress} />}
          {scene === "scoring" && <DemoScoring progress={sceneProgress} />}
          {scene === "shadow" && <DemoKinetic id="shadow" progress={sceneProgress} />}
          {scene === "collapse" && <DemoKinetic id="collapse" progress={sceneProgress} />}
          {scene === "blueprint" && <DemoBlueprintLive progress={sceneProgress} />}
          {scene === "privacy" && <DemoKinetic id="privacy" progress={sceneProgress} />}
          {scene === "why" && <DemoKinetic id="why" progress={sceneProgress} />}
          {scene === "outro" && <DemoKinetic id="outro" progress={sceneProgress} />}
        </>
      )}
    </div>
  );
}
