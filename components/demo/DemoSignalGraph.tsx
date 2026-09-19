"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Сигнальная диаграмма движка — НЕ карточки.
 * Живой граф: источники → слияние → скоринг → ИИ.
 * Пакеты летят по линиям, узлы пульсируют, лог пишется.
 */

const W = 900;
const H = 480;

const NODES = [
  { id: "you", x: 90, y: 240, label: "you", sub: "email (hashed)", color: "#1c1d16" },
  { id: "xon", x: 300, y: 110, label: "XposedOrNot", sub: "breach intel", color: "#3a4027" },
  { id: "leak", x: 300, y: 240, label: "LeakCheck", sub: "cross-check", color: "#3a4027" },
  { id: "tavily", x: 300, y: 370, label: "Tavily", sub: "web traces", color: "#3a4027" },
  { id: "merge", x: 510, y: 240, label: "merge", sub: "dedupe + provenance", color: "#a8835c" },
  { id: "score", x: 680, y: 240, label: "scoring engine", sub: "deterministic 0–100", color: "#d72638" },
  { id: "ai", x: 820, y: 110, label: "gemma", sub: "narrative only", color: "#3f0d12" },
  { id: "shadow", x: 820, y: 370, label: "shadow", sub: "16k particles", color: "#1c1d16" },
];

const EDGES: [string, string][] = [
  ["you", "xon"],
  ["you", "leak"],
  ["you", "tavily"],
  ["xon", "merge"],
  ["leak", "merge"],
  ["tavily", "merge"],
  ["merge", "score"],
  ["score", "ai"],
  ["score", "shadow"],
];

const LOG_LINES = [
  "→ querying engines in parallel…",
  "xon: 306 breaches · 3011ms",
  "leakcheck: 217 found · 4978ms",
  "→ merging: cross-confirmed signals +8 risk",
  "→ scoring: plaintext passwords +25",
  "→ scoring: recent 2026 breach +20",
  "tavily: 2 open-web traces",
  "gemma: interpreting (anonymized digest)",
  "✓ shadow manifested: 306 wounds",
];

interface Packet {
  edge: number;
  t: number;
  speed: number;
}

export default function DemoSignalGraph({ progress }: { progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logCount, setLogCount] = useState(0);
  const packetsRef = useRef<Packet[]>([]);
  const nodesById = Object.fromEntries(NODES.map((n) => [n.id, n]));

  // лог печатается по мере прогресса
  useEffect(() => {
    const target = Math.floor(progress * LOG_LINES.length);
    setLogCount((c) => Math.max(c, Math.min(LOG_LINES.length, target)));
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      // спавн пакетов
      if (Math.random() < 0.12) {
        packetsRef.current.push({
          edge: Math.floor(Math.random() * EDGES.length),
          t: 0,
          speed: 0.008 + Math.random() * 0.012,
        });
      }
      packetsRef.current = packetsRef.current.filter((p) => p.t < 1);

      // линии (рисуются по прогрессу)
      const lineReveal = Math.min(1, progress * 1.6);
      EDGES.forEach(([a, b], i) => {
        const na = nodesById[a];
        const nb = nodesById[b];
        const edgeProgress = Math.min(1, Math.max(0, lineReveal * EDGES.length - i));
        if (edgeProgress <= 0) return;

        const ex = na.x + (nb.x - na.x) * edgeProgress;
        const ey = na.y + (nb.y - na.y) * edgeProgress;

        ctx.strokeStyle = "rgba(28,29,22,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      });

      // пакеты
      for (const p of packetsRef.current) {
        p.t += p.speed;
        const [a, b] = EDGES[p.edge];
        const na = nodesById[a];
        const nb = nodesById[b];
        const x = na.x + (nb.x - na.x) * p.t;
        const y = na.y + (nb.y - na.y) * p.t;
        ctx.fillStyle = "rgba(215,38,56,0.85)";
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // узлы
      const nodeReveal = Math.min(1, progress * 2.2);
      NODES.forEach((n, i) => {
        const reveal = Math.min(1, Math.max(0, nodeReveal * NODES.length - i));
        if (reveal <= 0) return;
        const pulse = 1 + Math.sin(t * 2 + i) * 0.06;
        const r = 7 * reveal * pulse;

        // ореол для scoring
        if (n.id === "score") {
          ctx.strokeStyle = `rgba(215,38,56,${0.25 + Math.sin(t * 3) * 0.12})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 10 + Math.sin(t * 3) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(28,29,22,0.85)";
        ctx.font = "600 11px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(n.label.toUpperCase(), n.x, n.y - r - 10);
        ctx.fillStyle = "rgba(28,29,22,0.4)";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.fillText(n.sub, n.x, n.y + r + 16);
      });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [progress, nodesById]);

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-6 bg-canvas px-6">
      <canvas
        ref={canvasRef}
        style={{ width: "min(90vw, 900px)", height: "auto", aspectRatio: "900/480" }}
      />
      {/* живой лог */}
      <div className="w-full md:w-64 font-mono text-[11px] text-ink/60 space-y-1.5 self-center">
        {LOG_LINES.slice(0, logCount).map((line, i) => (
          <p key={i} className={line.startsWith("✓") ? "text-olive" : line.includes("+") ? "text-ruby" : ""}>
            {line}
          </p>
        ))}
        {logCount < LOG_LINES.length && <span className="text-ruby pulse-dot">▍</span>}
      </div>
    </div>
  );
}
