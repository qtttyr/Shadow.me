// ─── SHADOW.me — core domain types ───────────────────────────────────────────

export type RiskLevel = "SAFE" | "WARNING" | "CRITICAL";

export type DataCategory =
  | "passwords"
  | "emails"
  | "usernames"
  | "names"
  | "phones"
  | "addresses"
  | "dob"
  | "financial"
  | "government_ids"
  | "ip_addresses"
  | "location"
  | "social"
  | "other";

export interface BreachSourceRef {
  engine: "xposedornot" | "leakcheck" | "tavily";
}

export interface Breach {
  id: string;
  name: string;
  domain: string | null;
  date: string | null; // ISO date, best-known
  year: number | null;
  categories: DataCategory[];
  recordsExposed: number | null;
  passwordRisk: "plaintext" | "hashed" | "weak_hash" | "unknown" | null;
  description: string | null;
  industry: string | null;
  sources: BreachSourceRef[]; // provenance: which engines confirmed it
  score: number; // 0..100
  level: RiskLevel;
  reasons: string[]; // explainable scoring — shown to jury
}

export interface WebTrace {
  title: string;
  url: string;
  snippet: string;
}

export type ScanStage =
  | "idle"
  | "validating"
  | "querying"
  | "merging"
  | "scoring"
  | "web_traces"
  | "analyzing"
  | "done"
  | "error";

export interface ScanStats {
  totalBreaches: number;
  critical: number;
  warning: number;
  safe: number;
  shadowScore: number; // 0..100 — масса цифровой тени
  firstExposure: number | null; // year
  latestExposure: number | null; // year
  enginesUsed: string[];
  durationMs: number;
}

export interface ScanResult {
  id: string;
  scannedAt: string; // ISO
  breaches: Breach[];
  webTraces: WebTrace[];
  aiNarrative: string | null;
  aiActions: string[];
  stats: ScanStats;
}

// SSE events streamed from /api/scan
export type ScanEvent =
  | { type: "stage"; stage: ScanStage; message: string }
  | { type: "engine"; engine: string; status: "ok" | "empty" | "fail"; count: number; ms: number }
  | { type: "breach"; breach: Breach }
  | { type: "trace"; trace: WebTrace }
  | { type: "narrative"; text: string }
  | { type: "actions"; actions: string[] }
  | { type: "result"; result: ScanResult }
  | { type: "error"; message: string };
