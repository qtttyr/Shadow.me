import * as THREE from "three";

export const SHADOW_UNIFORMS = {
  uTime: { value: 0 },
  uManifest: { value: 0 }, // 0→1 сборка из пустоты
  uCollapse: { value: 0 }, // 0→1 схлопывание в точку
  uScroll: { value: 0 }, // 0→1 спуск вглубь (ScrollTrigger)
  uMouseWorld: { value: new THREE.Vector3(999, 999, 999) },
  uMouseStrength: { value: 1.0 },
  uPixelRatio: { value: 1 },
};

export const SHADOW_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uManifest;
uniform float uCollapse;
uniform float uScroll;
uniform vec3 uMouseWorld;
uniform float uMouseStrength;
uniform float uPixelRatio;

attribute float aRand;
attribute float aSeed;

varying vec3 vColor;
varying float vAlpha;
varying float vRand;

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0;
}

void main() {
  vColor = color;
  vRand = aRand;
  vec3 home = position;

  // ── рождение: разброс по большой сфере ──
  vec3 scatter = home * 7.0 + hash33(home + 0.5) * 5.0;
  vec3 pos = mix(scatter, home, uManifest);

  // ── дыхание / органический flow (скролл ускоряет ток крови) ──
  float speed = (0.5 + aRand * 0.9) * (1.0 + uScroll * 0.9);
  float t = uTime * speed + aSeed * 6.2831;
  vec3 swirl = vec3(
    sin(t * 0.7 + home.y * 2.2),
    sin(t * 0.5 + home.z * 2.6 + 1.7),
    sin(t * 0.6 + home.x * 2.1 + 4.1)
  );
  pos += swirl * (0.07 + aRand * 0.09 + uScroll * 0.1) * uManifest;

  // мягкое вращение тела (ускоряется на скролле)
  float rot = uTime * (0.045 + uScroll * 0.12) * (aRand > 0.5 ? 1.0 : -0.6);
  float cr = cos(rot), sr = sin(rot);
  pos.xz = mat2(cr, -sr, sr, cr) * pos.xz;

  // ── отталкивание от курсора ──
  vec3 toMouse = pos - uMouseWorld;
  float d = length(toMouse);
  float repel = smoothstep(1.6, 0.0, d) * uMouseStrength;
  pos += normalize(toMouse + 0.0001) * repel * 0.9;

  // ── схлопывание: поэтапно, с закруткой в воронку ──
  float stagger = clamp(uCollapse * 1.4 - aRand * 0.4, 0.0, 1.0);
  float e = stagger * stagger * (3.0 - 2.0 * stagger);
  float ang = atan(pos.z, pos.x) + e * (5.0 + aRand * 6.0);
  float rr = length(pos.xz) * (1.0 - e);
  vec3 collapsed = vec3(cos(ang) * rr, pos.y * (1.0 - e), sin(ang) * rr);
  pos = mix(pos, collapsed, e);
  pos *= 1.0 - 0.9 * e;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // размер: точечный размер в пикселях, угасание при схлопе
  gl_PointSize = (2.0 + aRand * 3.2) * (1.0 + uScroll * 0.35) * uPixelRatio * (1.0 / -mv.z) * 60.0;
  gl_PointSize *= mix(0.4, 1.0, uManifest) * (1.0 - 0.7 * e);

  // альфа: проявление, мерцание, угасание в точке
  vAlpha = uManifest * (0.55 + 0.45 * sin(t * 1.3 + aSeed * 40.0));
  vAlpha *= 1.0 - e * 0.95;
}
`;

export const SHADOW_FRAGMENT = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vRand;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  // мягкий край + горячее ядро точки
  float soft = smoothstep(0.5, 0.08, d);
  float core = smoothstep(0.18, 0.0, d) * 0.6;
  float a = vAlpha * soft;
  vec3 col = vColor + vColor * core;
  gl_FragColor = vec4(col, a);
}
`;

export function createShadowMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(SHADOW_UNIFORMS) as typeof SHADOW_UNIFORMS,
    vertexShader: SHADOW_VERTEX,
    fragmentShader: SHADOW_FRAGMENT,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
}
