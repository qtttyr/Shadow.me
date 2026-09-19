import type { Breach } from "@/lib/types";
import { streamAnalysis } from "@/lib/ai/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analyze — streams AI narrative deltas (plain text stream).
 * Runs in background while the user explores their shadow.
 */
export async function POST(req: Request) {
  let breaches: Breach[] = [];
  try {
    const body = await req.json();
    breaches = Array.isArray(body?.breaches) ? body.breaches.slice(0, 20) : [];
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!breaches.length) {
    return new Response("no breaches", { status: 200 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamAnalysis(breaches)) {
          controller.enqueue(encoder.encode(delta));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
