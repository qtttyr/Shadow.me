import type { Breach } from "@/lib/types";

/**
 * ── THE SHADOW ORGANISM ────────────────────────────────────────
 * Не сфера. Не тор. Асимметричное "дымное" существо:
 *  • ядро — органический blob, деформированный хэш-шумом;
 *  • нити — 8 закрученных столбов-дымок, поднимающихся вверх;
 *  • раны — кластеры утечек на оболочке (ruby = critical, amber = warning).
 * Каждая утечка физически вросла в тело тени.
 */

export interface ClusterMeta {
  breach: Breach;
  center: [number, number, number];
  radius: number;
}

export interface OrganismData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  rands: Float32Array;
  seeds: Float32Array;
  count: number;
  clusters: ClusterMeta[];
}

type RGB = [number, number, number];

const OLIVE: RGB = [0.227, 0.251, 0.153];
const CHARCOAL: RGB = [0.11, 0.114, 0.043];
const SAND: RGB = [0.761, 0.608, 0.447];
const RUBY: RGB = [0.843, 0.149, 0.22];
const BORDEAUX: RGB = [0.36, 0.06, 0.08];
const AMBER: RGB = [0.72, 0.42, 0.18];

const CORE_COUNT = 9000;
const STRAND_COUNT = 5000;
const STRANDS = 8;
const SHELL_R = 2.05;

function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

function gauss(): number {
  return (Math.random() + Math.random() + Math.random()) / 1.5 - 1;
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function buildOrganism(breaches: Breach[]): OrganismData {
  const clusterBreaches = breaches.filter((b) => b.level !== "SAFE").slice(0, 16);
  const clusterCounts = clusterBreaches.map((b) => (b.level === "CRITICAL" ? 130 : 70));
  const clusterTotal = clusterCounts.reduce((a, c) => a + c, 0);
  const count = CORE_COUNT + STRAND_COUNT + clusterTotal;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const rands = new Float32Array(count);
  const seeds = new Float32Array(count);
  const clusters: ClusterMeta[] = [];

  let i = 0;
  const push = (x: number, y: number, z: number, c: RGB, size: number) => {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
    sizes[i] = size;
    rands[i] = Math.random();
    seeds[i] = Math.random();
    i++;
  };

  // ── 1. CORE: деформированный органический blob ──────────────
  for (let n = 0; n < CORE_COUNT; n++) {
    let dx = gauss(), dy = gauss(), dz = gauss();
    const len = Math.hypot(dx, dy, dz) || 1;
    dx /= len; dy /= len; dz /= len;

    const noise = hash3(dx * 2.3 + 5, dy * 2.3, dz * 2.3);
    const baseR = 1.3 * (0.78 + 0.5 * noise);
    const r = baseR * Math.pow(Math.random(), 0.32);

    let x = dx * r;
    let y = dy * r * 0.92; // сплюснуть по вертикали
    let z = dz * r;

    // поверхностная шероховатость
    const rough = (hash3(dx * 7, dy * 7, dz * 7) - 0.5) * 0.28;
    x += dx * rough; y += dy * rough; z += dz * rough;

    const t = Math.random();
    const color = Math.random() < 0.02 ? SAND : mix(OLIVE, CHARCOAL, t);
    push(x, y, z, color, 0.55 + Math.random() * 0.95);
  }

  // ── 2. STRANDS: закрученные дымные нити вверх ───────────────
  for (let n = 0; n < STRAND_COUNT; n++) {
    const k = Math.floor(Math.random() * STRANDS);
    const theta0 = (k / STRANDS) * Math.PI * 2 + hash3(k, 1, 2) * 0.8;
    const h = Math.pow(Math.random(), 1.4) * 2.6; // высота над ядром
    const y = 0.5 + h;
    const swirl = theta0 + h * 1.15;
    const r = (0.32 * (1 - h / 3.6) + 0.04) * (0.55 + 0.45 * Math.random());
    const x = Math.cos(swirl) * r + gauss() * 0.05;
    const z = Math.sin(swirl) * r + gauss() * 0.05;

    const color = mix(SAND, OLIVE, 0.5 + Math.random() * 0.35);
    push(x, y, z, color, 0.3 + Math.random() * 0.6);
  }

  // ── 3. WOUNDS: кластеры утечек на оболочке ──────────────────
  const M = clusterBreaches.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let j = 0; j < M; j++) {
    const b = clusterBreaches[j];
    const critical = b.level === "CRITICAL";

    // fibonacci shell — равномерно и непредсказуемо
    const fy = 1 - ((j + 0.5) / M) * 2;
    const fr = Math.sqrt(Math.max(0, 1 - fy * fy));
    const ftheta = j * golden;
    const cx = Math.cos(ftheta) * fr * SHELL_R;
    const cy = fy * SHELL_R * 0.8;
    const cz = Math.sin(ftheta) * fr * SHELL_R;

    const spread = critical ? 0.3 : 0.22;
    const palette = critical ? mix(RUBY, BORDEAUX, Math.random() * 0.5) : AMBER;
    const n = clusterCounts[j];
    for (let p = 0; p < n; p++) {
      const x = cx + gauss() * spread;
      const y = cy + gauss() * spread;
      const z = cz + gauss() * spread;
      const color = critical
        ? mix(RUBY, BORDEAUX, Math.random() * 0.6)
        : mix(AMBER, BORDEAUX, Math.random() * 0.3);
      push(x, y, z, color, (critical ? 1.5 : 1.0) + Math.random() * (critical ? 1.2 : 0.7));
    }
    clusters.push({
      breach: b,
      center: [cx, cy, cz],
      radius: critical ? 0.52 : 0.4,
    });
  }

  return { positions, colors, sizes, rands, seeds, count, clusters };
}
