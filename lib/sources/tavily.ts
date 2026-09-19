import type { WebTrace } from "@/lib/types";

const BASE = "https://api.tavily.com/search";
const TIMEOUT_MS = 8000;
const MAX_RESULTS = 6;

interface TavilyResponse {
  results?: { title: string; url: string; content: string }[];
}

export interface TavilyResult {
  traces: WebTrace[];
  ok: boolean;
  skipped: boolean;
}

/**
 * Searches the open web for public traces of the email.
 * Costs ~1 Tavily credit per call. Skipped silently if no key.
 */
export async function scanWebTraces(email: string): Promise<TavilyResult> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return { traces: [], ok: false, skipped: true };

  try {
    const res = await fetch(BASE, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query: `"${email.trim().toLowerCase()}"`,
        search_depth: "basic",
        max_results: MAX_RESULTS,
      }),
      cache: "no-store",
    });
    if (!res.ok) return { traces: [], ok: false, skipped: false };
    const data = (await res.json()) as TavilyResponse;
    const traces: WebTrace[] = (data.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 220) ?? "",
    }));
    return { traces, ok: true, skipped: false };
  } catch {
    return { traces: [], ok: false, skipped: false };
  }
}
