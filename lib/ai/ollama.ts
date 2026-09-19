import type { Breach } from "@/lib/types";

const OLLAMA_URL = "https://ollama.com/api/chat";
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4:31b";
const TIMEOUT_MS = 25_000;

interface OllamaChatResponse {
  message?: { content?: string };
}

export interface AiAnalysis {
  narrative: string;
  actions: string[];
}

interface DigestItem {
  name: string;
  year: number | null;
  categories: string;
  score: number;
  level: string;
  passwordRisk: string | null;
}

function buildDigest(breaches: Breach[]): DigestItem[] {
  return breaches.slice(0, 12).map((b) => ({
    name: b.name,
    year: b.year,
    categories: b.categories.join(", "),
    score: b.score,
    level: b.level,
    passwordRisk: b.passwordRisk,
  }));
}

const SYSTEM_PROMPT = `You are the voice of SHADOW.me — a digital self-awareness instrument.
A person's data exposure has been measured by a deterministic multi-engine scoring system.
Speak like a precise, poetic, slightly haunting art installation. Short sentences. No fluff.

Given the measured exposures (anonymized metadata only), respond with EXACTLY this format:
NARRATIVE: <3-5 sentences, second person "your shadow" — how it grew, which wounds are deepest, which attacks this enables (credential stuffing / phishing / identity theft — only relevant ones)>
ACTIONS:
1. <concrete cleanup action, max 12 words, starts with a verb>
2. ... (3-5 actions total)`;

function parseAnalysis(content: string): AiAnalysis {
  const narrativeMatch = content.match(/NARRATIVE:\s*([\s\S]*?)(?=ACTIONS:|$)/i);
  const actionsMatch = content.match(/ACTIONS:\s*([\s\S]*)$/i);
  const actions = (actionsMatch?.[1] ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-•])\s*/, "").trim())
    .filter((l) => l.length > 3 && l.length < 140)
    .slice(0, 5);
  return {
    narrative: (narrativeMatch?.[1] ?? content).trim(),
    actions,
  };
}

async function chat(key: string, messages: { role: string; content: string }[]): Promise<string | null> {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages, stream: false }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as OllamaChatResponse;
  return data.message?.content?.trim() ?? null;
}

/**
 * AI Layer — интерпретация, а НЕ фактология.
 * Модель получает только обезличенные метаданные (без email!)
 * и превращает детерминированный risk-score в человеческий рассказ.
 * Факты (лик/не лик) решает scoring engine — модель не может "наврать".
 */
export async function analyzeShadow(breaches: Breach[]): Promise<AiAnalysis | null> {
  const key = process.env.OLLAMA_API_KEY;
  if (!key || breaches.length === 0) return null;

  try {
    const content = await chat(key, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(buildDigest(breaches)) },
    ]);
    if (!content) return null;
    return parseAnalysis(content);
  } catch {
    return null;
  }
}

export async function* streamAnalysis(breaches: Breach[]): AsyncGenerator<string> {
  const key = process.env.OLLAMA_API_KEY;
  if (!key || breaches.length === 0) return;

  let res: Response;
  try {
    res = await fetch(OLLAMA_URL, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS + 15_000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(buildDigest(breaches)) },
        ],
        stream: true,
      }),
      cache: "no-store",
    });
  } catch {
    return;
  }
  if (!res.ok || !res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const json = JSON.parse(trimmed) as { message?: { content?: string } };
          const delta = json.message?.content;
          if (delta) yield delta;
        } catch {
          // partial line — keep buffering
        }
      }
    }
  } catch {
    // stream aborted — client keeps what it got
  }
}

/** Deterministic fallback actions if AI is unavailable — engine stays useful. */
export function fallbackActions(breaches: Breach[]): string[] {
  const actions: string[] = [];
  const withPasswords = breaches.filter((b) => b.categories.includes("passwords"));
  if (withPasswords.length) {
    actions.push(
      `Change passwords reused since ${withPasswords[0].name} breach (${withPasswords[0].year ?? "?"})`
    );
    actions.push("Enable a password manager — unique password per service");
  }
  if (breaches.some((b) => b.categories.includes("phones"))) {
    actions.push("Watch for targeted SMS phishing (smishing)");
  }
  if (breaches.some((b) => b.categories.includes("financial"))) {
    actions.push("Freeze credit / enable bank fraud alerts");
  }
  actions.push("Turn on 2FA with an authenticator app, not SMS");
  actions.push("Delete dormant accounts you no longer use");
  return actions.slice(0, 5);
}
