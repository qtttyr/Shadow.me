import type { Breach, ScanEvent, ScanResult } from "@/lib/types";
import { scanXposedOrNot } from "@/lib/sources/xposedornot";
import { scanLeakCheck } from "@/lib/sources/leakcheck";
import { scanWebTraces } from "@/lib/sources/tavily";
import { mergeBreaches } from "@/lib/engine/aggregate";
import { scoreBreach, buildStats } from "@/lib/engine/scoring";
import { fallbackActions } from "@/lib/ai/ollama";
import { createHash, randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── in-memory cache (5 min) — экономит rate limits, ускоряет повторы ──
const cache = new Map<string, { at: number; result: ScanResult }>();
const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(email: string) {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
}

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 422 });
  }

  const encoder = new TextEncoder();
  const t0 = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: ScanEvent) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };
      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };
      const stage = (s: ScanEvent & { type: "stage" }) => send(s);

      try {
        // ── 0. validation ──────────────────────────────────────
        stage({ type: "stage", stage: "validating", message: "Identity accepted. No storage. No trace." });

        const key = cacheKey(email);
        const hit = cache.get(key);
        if (hit && Date.now() - hit.at < CACHE_TTL) {
          // replay cached result as live-looking stream
          for (const b of hit.result.breaches) send({ type: "breach", breach: b });
          send({ type: "result", result: { ...hit.result, stats: { ...hit.result.stats, durationMs: Date.now() - t0 } } });
          close();
          return;
        }

        // ── 1. parallel engine queries ─────────────────────────
        stage({ type: "stage", stage: "querying", message: "Querying breach intelligence engines…" });

        const timed = async <T,>(
          engine: string,
          fn: () => Promise<{ breaches: Breach[]; ok: boolean }>
        ): Promise<{ breaches: Breach[]; engine: string }> => {
          const s = Date.now();
          try {
            const r = await fn();
            send({
              type: "engine",
              engine,
              status: r.breaches.length ? "ok" : r.ok ? "empty" : "fail",
              count: r.breaches.length,
              ms: Date.now() - s,
            });
            return { breaches: r.breaches, engine };
          } catch {
            send({ type: "engine", engine, status: "fail", count: 0, ms: Date.now() - s });
            return { breaches: [], engine };
          }
        };

        const [xon, lc] = await Promise.all([
          timed("xposedornot", () => scanXposedOrNot(email)),
          timed("leakcheck", () => scanLeakCheck(email)),
        ]);

        // ── 2. merge + dedupe ──────────────────────────────────
        stage({ type: "stage", stage: "merging", message: "Cross-referencing engines. Deduplicating signals…" });
        const merged = mergeBreaches([xon.breaches, lc.breaches]);

        // ── 3. deterministic scoring ───────────────────────────
        stage({ type: "stage", stage: "scoring", message: "Weighing each exposure. Building your shadow…" });
        const scored = merged.map(scoreBreach).sort((a, b) => b.score - a.score);
        for (const b of scored) send({ type: "breach", breach: b });

        // ── 4. open-web traces ─────────────────────────────────
        // AI-интерпретация вынесена в /api/analyze и запускается клиентом
        // параллельно с 3D-сценой — сканирование остаётся мгновенным.
        stage({ type: "stage", stage: "web_traces", message: "Sweeping the open web for public traces…" });
        const traces = await scanWebTraces(email);
        for (const t of traces.traces) send({ type: "trace", trace: t });

        // deterministic actions now; AI-нарратив догрузится отдельным стримом
        send({ type: "actions", actions: fallbackActions(scored) });

        // ── 6. final result ────────────────────────────────────
        const enginesUsed = [
          ...new Set([xon, lc].filter((r) => r.breaches.length || true).map((r) => r.engine)),
          ...(traces.ok ? ["tavily"] : []),
        ];
        const result: ScanResult = {
          id: randomUUID(),
          scannedAt: new Date().toISOString(),
          breaches: scored,
          webTraces: traces.traces,
          aiNarrative: null, // догружается отдельно через /api/analyze
          aiActions: fallbackActions(scored),
          stats: buildStats(scored, enginesUsed, Date.now() - t0),
        };
        cache.set(key, { at: Date.now(), result });
        if (cache.size > 500) cache.clear(); // naive bound

        send({ type: "result", result });
        stage({ type: "stage", stage: "done", message: "Shadow manifested." });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Scan failed",
        });
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
