"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";
import ShadowOrganism from "./ShadowOrganism";
import { useExperience } from "@/store/experience";

/** Камера «ныряет» внутрь тени по мере скролла. */
function CameraRig() {
  const last = useRef(-1);
  useFrame(({ camera }) => {
    const s = useExperience.getState().scrollProgress;
    if (Math.abs(s - last.current) < 0.001) return;
    last.current = s;
    camera.position.z = 6.4 - s * 3.4;
    camera.position.y = 0.4 + s * 0.6;
    camera.lookAt(0, -0.2, 0);
  });
  return null;
}

/**
 * Полноэкранная 3D-сцена тени.
 * dpr ограничен ради скорости, bloom даёт свечение ран, noise — зерно.
 */
export default function ShadowScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, 6.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <CameraRig />
        <ShadowOrganism />
        <EffectComposer>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.12}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
          <Noise opacity={0.06} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
