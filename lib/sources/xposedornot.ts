import type { Breach, DataCategory } from "@/lib/types";

const BASE = "https://api.xposedornot.com/v1";
const TIMEOUT_MS = 6000;

// ── raw API shapes ─────────────────────────────────────────────
interface XonEmailResponse {
  breaches?: string[][]; // [[name, domain, industry, date, records?], ...]
  Error?: string;
}

interface XonAnalytics {
  ExposedBreaches?: {
    breaches_details?: {
      breach?: string;
      domain?: string;
      industry?: string;
      xposed_data?: string; // "Emails ; Passwords ; Phone Numbers"
      xposed_records?: number;
      xposed_date?: string; // e.g. "2021-04"
      password_risk?: string; // "plaintext" | "easytocrack" | "hardtocrack" | "unknown"
    }[];
  };
}

const CATEGORY_MAP: Record<string, DataCategory> = {
  email: "emails",
  password: "passwords",
  username: "usernames",
  name: "names",
  phone: "phones",
  address: "addresses",
  dob: "dob",
  "date of birth": "dob",
  bank: "financial",
  credit: "financial",
  card: "financial",
  passport: "government_ids",
  license: "government_ids",
  ssn: "government_ids",
  ip: "ip_addresses",
  geolocation: "location",
  location: "location",
  social: "social",
};

export function mapCategories(raw: string | undefined): DataCategory[] {
  if (!raw) return ["other"];
  const parts = raw
    .split(/[;,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const out = new Set<DataCategory>();
  for (const p of parts) {
    const key = Object.keys(CATEGORY_MAP).find((k) => p.includes(k));
    out.add(key ? CATEGORY_MAP[key] : "other");
  }
  return out.size ? [...out] : ["other"];
}

function mapPasswordRisk(raw?: string): Breach["passwordRisk"] {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v.includes("plain")) return "plaintext";
  if (v.includes("easy")) return "weak_hash";
  if (v.includes("hard")) return "hashed";
  return "unknown";
}

export interface XonResult {
  breaches: Breach[];
  ok: boolean;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "shadow.me/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function scanXposedOrNot(email: string): Promise<XonResult> {
  const enc = encodeURIComponent(email.trim().toLowerCase());
  const [emailData, analytics] = await Promise.all([
    fetchJson<XonEmailResponse>(`${BASE}/check-email/${enc}`),
    fetchJson<XonAnalytics>(`${BASE}/breach-analytics?email=${enc}`),
  ]);

  const details = new Map(
    (analytics?.ExposedBreaches?.breaches_details ?? [])
      .filter((d) => d.breach)
      .map((d) => [d.breach!.toLowerCase(), d])
  );

  const names = new Set<string>();
  for (const group of emailData?.breaches ?? []) {
    for (const name of group) if (name) names.add(name);
  }
  for (const key of details.keys()) names.add(key);

  const breaches: Breach[] = [...names].map((rawName) => {
    const d = details.get(rawName.toLowerCase());
    const name = d?.breach ?? rawName;
    const date = d?.xposed_date ?? null;
    const year = date ? parseInt(date.slice(0, 4), 10) || null : null;
    return {
      id: `xon:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name,
      domain: d?.domain ?? null,
      date,
      year,
      categories: mapCategories(d?.xposed_data),
      recordsExposed: d?.xposed_records ?? null,
      passwordRisk: mapPasswordRisk(d?.password_risk),
      description: null,
      industry: d?.industry ?? null,
      sources: [{ engine: "xposedornot" }],
      score: 0,
      level: "SAFE",
      reasons: [],
    };
  });

  return { breaches, ok: breaches.length > 0 || !!emailData };
}
