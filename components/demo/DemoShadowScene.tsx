"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";
import ShadowOrganism from "@/components/experience/ShadowOrganism";
import { useExperience } from "@/store/experience";

/**
 * Кинематографичный дрейф камеры для демо-фильма.
 * Медленный орбитальный облёт + лёгкое приближение.
 */
function CinematicRig({ progress }: { progress: number }) {
  const vec = useRef(new THREE.Vector3());
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.12;
    const radius = 6.6 - progress * 2.2;
    vec.current.set(
      Math.sin(t) * radius,
      0.6 + Math.sin(t * 0.7) * 0.5,
      Math.cos(t) * radius
    );
    camera.position.lerp(vec.current, 0.03);
    camera.lookAt(0, -0.2, 0);
  });
  return null;
}

/** Полноценная 3D-сцена тени для демо — с орбитальной камерой. */
export default function DemoShadowScene({ progress }: { progress: number }) {
  const phase = useExperience((s) => s.phase);
  if (phase !== "manifest") return null;

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.5, 6.6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <CinematicRig progress={progress} />
        <ShadowOrganism />
        <EffectComposer>
          <Bloom intensity={0.9} luminanceThreshold={0.12} luminanceSmoothing={0.4} mipmapBlur />
          <Noise opacity={0.05} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
