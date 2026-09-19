"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { buildOrganism } from "@/lib/three/organism";
import { createShadowMaterial } from "@/lib/three/shadowMaterial";
import { useExperience } from "@/store/experience";
import { audio } from "@/lib/audio/shadowAudio";

const _ray = new THREE.Raycaster();
const _v = new THREE.Vector3();
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

export default function ShadowOrganism() {
  const result = useExperience((s) => s.result);
  const phase = useExperience((s) => s.phase);
  const setHovered = useExperience((s) => s.setHoveredBreach);

  const material = useMemo(() => createShadowMaterial(), []);
  const breachesKey = result?.id ?? "empty";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const organism = useMemo(
    () => buildOrganism(result?.breaches ?? []),
    [breachesKey]
  );

  const groupRef = useRef<THREE.Group>(null);
  const hoverTween = useRef<gsap.core.Tween | null>(null);
  const manifested = useRef(false);
  const collapsed = useRef(false);
  const { camera, pointer } = useThree();

  // ── manifest entrance: сборка из пустоты ──
  if (phase === "manifest" && !manifested.current) {
    manifested.current = true;
    audio.startDrone();
    gsap.to(material.uniforms.uManifest, {
      value: 1,
      duration: 2.8,
      ease: "power3.inOut",
    });
  }

  // ── collapse: вся тень стягивается в точку ──
  if (phase === "collapse" && !collapsed.current) {
    collapsed.current = true;
    audio.collapse(2.2);
    gsap.to(material.uniforms.uCollapse, {
      value: 1,
      duration: 2.2,
      ease: "power4.in",
      onComplete: () => {
        audio.resolve();
        audio.stopDrone();
        useExperience.getState().setClean();
        useExperience.getState().setPhase("blueprint");
      },
    });
    gsap.to(material.uniforms.uMouseStrength, { value: 0, duration: 0.4 });
  }

  useFrame((state, dt) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    // курсор → мировые координаты на плоскости z=0
    _v.set(pointer.x, pointer.y, 0.5).unproject(camera);
    _ray.set(camera.position, _v.sub(camera.position).normalize());
    const hit = new THREE.Vector3();
    if (_ray.ray.intersectPlane(_plane, hit)) {
      if (groupRef.current) groupRef.current.worldToLocal(hit);
      material.uniforms.uMouseWorld.value.lerp(hit, 0.12);
    }

    // медленный поворот за курсором (зеркальный, чтобы следовать взглядом)
    if (groupRef.current) {
      groupRef.current.rotation.y += (-pointer.x * 0.35 - groupRef.current.rotation.y) * 0.04;
      groupRef.current.rotation.x += (-pointer.y * 0.2 - groupRef.current.rotation.x) * 0.04;
    }

    // ── hover по кластерам-ранам (в мировом пространстве) ──
    if (phase === "manifest" && organism.clusters.length) {
      const m = material.uniforms.uMouseWorld.value;
      let found: (typeof organism.clusters)[number] | null = null;
      let best = Infinity;
      for (const c of organism.clusters) {
        _v.set(c.center[0], c.center[1], c.center[2]);
        const d = m.distanceTo(_v);
        if (d < c.radius + 0.25 && d < best) {
          best = d;
          found = c;
        }
      }
      const current = useExperience.getState().hoveredBreach;
      if (found?.breach.id !== current?.id) {
        setHovered(found?.breach ?? null);
        if (found) audio.hover(found.breach.level === "CRITICAL");
        hoverTween.current?.kill();
        hoverTween.current = gsap.to(material.uniforms.uMouseStrength, {
          value: found ? 2.2 : 1.0,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    }

    void dt;
  });

  return (
    <group ref={groupRef} position={[0, -0.35, 0]}>
      <points frustumCulled={false}>
        <bufferGeometry key={organism.count}>
          <bufferAttribute attach="attributes-position" args={[organism.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[organism.colors, 3]} />
          <bufferAttribute attach="attributes-aRand" args={[organism.rands, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[organism.seeds, 1]} />
        </bufferGeometry>
        <primitive object={material} attach="material" />
      </points>
    </group>
  );
}
