import type { Breach } from "@/lib/types";

/**
 * Merges breach lists from multiple engines into one canonical set.
 * Same service found in two engines = stronger signal (provenance bonus).
 *
 * ВАЖНО про честность данных:
 * LeakCheck public API отдаёт `fields` как ОБЪЕДИНЕНИЕ по всем найденным
 * утечкам — это не per-breach данные. Поэтому:
 *  - XposedOrNot (per-breach категории) всегда побеждает по категориям;
 *  - LeakCheck даёт provenance (+8 к скору) и открывает новые имена;
 *  - union-категории LeakCheck никогда не приписываются чужой утечке.
 */
export function mergeBreaches(lists: Breach[][]): Breach[] {
  const byKey = new Map<string, Breach>();

  const keyOf = (b: Breach) =>
    (b.domain ?? b.name).toLowerCase().replace(/[^a-z0-9]+/g, "");

  for (const list of lists) {
    for (const b of list) {
      const key = keyOf(b);
      if (!key) continue;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { ...b, id: `b:${key}` });
        continue;
      }

      // provenance: дедупликация по имени движка
      const engines = new Set(existing.sources.map((s) => s.engine));
      for (const s of b.sources) {
        if (!engines.has(s.engine)) {
          existing.sources.push(s);
          engines.add(s.engine);
        }
      }

      if (!existing.date && b.date) {
        existing.date = b.date;
        existing.year = b.year;
      }
      if (!existing.recordsExposed && b.recordsExposed) {
        existing.recordsExposed = b.recordsExposed;
      }
      if (!existing.passwordRisk && b.passwordRisk) {
        existing.passwordRisk = b.passwordRisk;
      }
      if (!existing.industry && b.industry) existing.industry = b.industry;

      // категории: per-breach (xon) > union (leakcheck)
      const existingHasXon = existing.sources.some((s) => s.engine === "xposedornot");
      const newIsXon = b.sources.some((s) => s.engine === "xposedornot");
      const existingOnlyOther =
        existing.categories.length === 1 && existing.categories[0] === "other";
      if (newIsXon && !existingHasXon) {
        existing.categories = b.categories; // апгрейд до точных per-breach
      } else if (!newIsXon && existingHasXon) {
        // union от leakcheck не добавляем — он не про эту конкретную утечку
      } else if (existingOnlyOther) {
        existing.categories = b.categories;
      }

      // prefer the canonical (prettier) name
      if (existing.name.length < b.name.length) existing.name = b.name;
    }
  }

  return [...byKey.values()].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}
