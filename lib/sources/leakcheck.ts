import type { Breach, DataCategory } from "@/lib/types";

const BASE = "https://leakcheck.io/api/public";
const TIMEOUT_MS = 6000;

interface LeakCheckResponse {
  success: boolean;
  found?: number;
  fields?: string[];
  sources?: { name: string; date?: string }[];
  error?: string;
}

const FIELD_MAP: Record<string, DataCategory> = {
  email: "emails",
  password: "passwords",
  password_hash: "passwords",
  username: "usernames",
  first_name: "names",
  last_name: "names",
  phone: "phones",
  address: "addresses",
  dob: "dob",
  bank: "financial",
  card: "financial",
  passport: "government_ids",
  ip: "ip_addresses",
  location: "location",
  social: "social",
};

export function mapLeakCheckFields(fields: string[] | undefined): DataCategory[] {
  if (!fields?.length) return ["other"];
  const out = new Set<DataCategory>();
  for (const f of fields) {
    out.add(FIELD_MAP[f.toLowerCase()] ?? "other");
  }
  return [...out];
}

export interface LeakCheckResult {
  breaches: Breach[];
  ok: boolean;
}

export async function scanLeakCheck(email: string): Promise<LeakCheckResult> {
  try {
    const url = `${BASE}?check=${encodeURIComponent(email.trim().toLowerCase())}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "shadow.me/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return { breaches: [], ok: false };
    const data = (await res.json()) as LeakCheckResponse;
    if (!data.success || !data.sources?.length) {
      return { breaches: [], ok: data.success };
    }

    const sharedCategories = mapLeakCheckFields(data.fields);
    const breaches: Breach[] = data.sources.map((s) => {
      const year = s.date ? parseInt(s.date.slice(0, 4), 10) || null : null;
      return {
        id: `lc:${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: s.name.replace(/\.(com|net|org|io|ru)$/i, ""),
        domain: s.name.includes(".") ? s.name : null,
        date: s.date ?? null,
        year,
        // LeakCheck public API returns fields aggregated across all breaches,
        // so attach the union only to cross-check; scoring will weigh it down.
        categories: sharedCategories,
        recordsExposed: null,
        passwordRisk: sharedCategories.includes("passwords") ? "unknown" : null,
        description: null,
        industry: null,
        sources: [{ engine: "leakcheck" }],
        score: 0,
        level: "SAFE",
        reasons: [],
      };
    });

    return { breaches, ok: true };
  } catch {
    return { breaches: [], ok: false };
  }
}
