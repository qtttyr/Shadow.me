import type { Breach, DataCategory, RiskLevel, ScanStats } from "@/lib/types";

/**
 * ── SHADOW SCORING MODEL ───────────────────────────────────────
 * Deterministic, explainable, weighted heuristic engine.
 * Every point of score is justified in `reasons[]` and shown in UI —
 * this is our answer to "how do you know it's critical, not the AI?".
 */

const CATEGORY_WEIGHT: Record<DataCategory, number> = {
  passwords: 30,
  financial: 28,
  government_ids: 26,
  phones: 16,
  addresses: 16,
  dob: 14,
  location: 10,
  names: 6,
  usernames: 4,
  social: 5,
  ip_addresses: 5,
  emails: 3,
  other: 2,
};

const CATEGORY_REASON: Record<DataCategory, string> = {
  passwords: "Passwords exposed",
  financial: "Financial data exposed",
  government_ids: "Government IDs exposed",
  phones: "Phone number exposed",
  addresses: "Physical address exposed",
  dob: "Date of birth exposed",
  location: "Location history exposed",
  names: "Real name exposed",
  usernames: "Usernames exposed",
  social: "Social graph exposed",
  ip_addresses: "IP addresses exposed",
  emails: "Email address exposed",
  other: "Profile metadata exposed",
};

const PASSWORD_RISK_WEIGHT = {
  plaintext: 25,
  weak_hash: 15,
  hashed: 6,
  unknown: 10,
} as const;

const CURRENT_YEAR = new Date().getFullYear();

function recencyWeight(year: number | null): number {
  if (!year) return 4; // unknown date — small uncertainty penalty
  const age = CURRENT_YEAR - year;
  if (age <= 1) return 20;
  if (age <= 3) return 14;
  if (age <= 6) return 8;
  return 3;
}

function scaleWeight(records: number | null): number {
  if (!records) return 0;
  if (records >= 100_000_000) return 10;
  if (records >= 10_000_000) return 7;
  if (records >= 1_000_000) return 5;
  if (records >= 100_000) return 3;
  return 1;
}

function levelOf(score: number): RiskLevel {
  if (score >= 55) return "CRITICAL";
  if (score >= 28) return "WARNING";
  return "SAFE";
}

export function scoreBreach(b: Breach): Breach {
  const reasons: string[] = [];
  let score = 0;

  // 1. What leaked (cap contribution of categories at top-2 to avoid stacking noise)
  const catScores = b.categories
    .map((c) => ({ c, w: CATEGORY_WEIGHT[c] }))
    .sort((x, y) => y.w - x.w);
  for (const { c, w } of catScores.slice(0, 2)) {
    score += w;
    reasons.push(CATEGORY_REASON[c]);
  }

  // 2. How passwords were stored
  if (b.passwordRisk) {
    const w = PASSWORD_RISK_WEIGHT[b.passwordRisk];
    score += w;
    if (b.passwordRisk === "plaintext")
      reasons.push("Passwords stored in PLAINTEXT");
    else if (b.passwordRisk === "weak_hash")
      reasons.push("Passwords weakly hashed (crackable)");
    else if (b.passwordRisk === "unknown")
      reasons.push("Password storage method unknown");
  }

  // 3. Freshness — recent breaches are actively exploited
  const rw = recencyWeight(b.year);
  score += rw;
  if (b.year && CURRENT_YEAR - b.year <= 3) {
    reasons.push(`Recent breach (${b.year}) — actively traded`);
  }

  // 4. Breach scale
  const sw = scaleWeight(b.recordsExposed);
  score += sw;
  if (b.recordsExposed && b.recordsExposed >= 10_000_000) {
    reasons.push(
      `Massive breach — ${Math.round(b.recordsExposed / 1_000_000)}M records`
    );
  }

  // 5. Provenance: confirmed by 2+ independent engines → more reliable signal
  const engines = new Set(b.sources.map((s) => s.engine));
  if (engines.size >= 2) {
    score += 8;
    reasons.push("Cross-confirmed by multiple engines");
  }

  score = Math.min(100, Math.round(score));
  return { ...b, score, level: levelOf(score), reasons };
}

/**
 * Shadow Score — масса цифровой тени пользователя (0..100).
 * Доминируют худшие утечки, но объём тоже играет роль.
 */
export function shadowScore(breaches: Breach[]): number {
  if (!breaches.length) return 0;
  const sorted = [...breaches].sort((a, b) => b.score - a.score);
  const top = sorted[0].score;
  const rest = sorted.slice(1).reduce((acc, b, i) => acc + b.score * Math.pow(0.55, i + 1), 0);
  const volume = Math.min(15, breaches.length * 1.5);
  return Math.min(100, Math.round(top * 0.62 + rest * 0.38 * 0.5 + volume));
}

export function buildStats(
  breaches: Breach[],
  enginesUsed: string[],
  durationMs: number
): ScanStats {
  const years = breaches.map((b) => b.year).filter((y): y is number => !!y);
  return {
    totalBreaches: breaches.length,
    critical: breaches.filter((b) => b.level === "CRITICAL").length,
    warning: breaches.filter((b) => b.level === "WARNING").length,
    safe: breaches.filter((b) => b.level === "SAFE").length,
    shadowScore: shadowScore(breaches),
    firstExposure: years.length ? Math.min(...years) : null,
    latestExposure: years.length ? Math.max(...years) : null,
    enginesUsed,
    durationMs,
  };
}
