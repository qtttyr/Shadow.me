import type { ScanResult } from "@/lib/types";

/**
 * Генерация Blueprint-PDF — редакционный дизайн паспорта.
 * jsPDF подгружается лениво (только по клику) — не весит в бандле.
 */
export async function exportBlueprintPdf(
  result: ScanResult,
  narrative: string,
  email: string | null
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // палитра
  const INK: [number, number, number] = [28, 29, 22];
  const RUBY: [number, number, number] = [215, 38, 56];
  const OLIVE: [number, number, number] = [58, 64, 39];
  const SAND: [number, number, number] = [194, 155, 114];
  const GREY: [number, number, number] = [140, 138, 128];

  const W = 210;
  const M = 18; // margin
  let y = 0;

  const rule = (yy: number, weight = 0.3) => {
    doc.setDrawColor(...INK);
    doc.setLineWidth(weight);
    doc.line(M, yy, W - M, yy);
  };

  // ── cover block ──────────────────────────────────────────────
  doc.setFillColor(245, 242, 235);
  doc.rect(0, 0, W, 297, "F");

  y = 26;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("SHADOW.ME / DIGITAL PASSPORT", M, y);
  doc.text(new Date(result.scannedAt).toLocaleDateString("en-GB"), W - M, y, {
    align: "right",
  });

  y += 4;
  rule(y, 0.6);

  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.setTextColor(...INK);
  doc.text("YOUR", M, y);
  y += 15;
  doc.setTextColor(...RUBY);
  doc.text("SHADOW", M, y);

  y += 20;
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(`SUBJECT  ${email ?? "anonymous"}`, M, y);
  y += 5;
  doc.text(`SCAN ID  ${result.id}`, M, y);
  y += 5;
  doc.text(
    `ENGINES  ${result.stats.enginesUsed.join(" + ").toUpperCase()}`,
    M,
    y
  );

  // ── score gauge ──────────────────────────────────────────────
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(64);
  doc.setTextColor(...INK);
  doc.text(String(result.stats.shadowScore), M, y);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("SHADOW MASS / 100", M, y + 6);

  const barY = y + 12;
  doc.setFillColor(230, 226, 216);
  doc.rect(M, barY, W - 2 * M, 2.5, "F");
  const scoreW = ((W - 2 * M) * result.stats.shadowScore) / 100;
  doc.setFillColor(...(result.stats.shadowScore >= 55 ? RUBY : OLIVE));
  doc.rect(M, barY, scoreW, 2.5, "F");

  // ── narrative ────────────────────────────────────────────────
  if (narrative) {
    y = barY + 16;
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...SAND);
    doc.text("INTERPRETATION", M, y);
    y += 6;
    doc.setFont("courier", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(narrative, W - 2 * M);
    doc.text(lines.slice(0, 8), M, y);
    y += Math.min(8, lines.length) * 4.5;
  }

  // ── wound ledger ─────────────────────────────────────────────
  y += 10;
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...SAND);
  doc.text("WOUND LEDGER", M, y);
  y += 3;
  rule(y, 0.2);
  y += 6;

  const top = [...result.breaches].sort((a, b) => b.score - a.score).slice(0, 14);
  for (const b of top) {
    if (y > 268) break;
    const color = b.level === "CRITICAL" ? RUBY : b.level === "WARNING" ? SAND : OLIVE;
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(String(b.year ?? "????"), M, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(b.name.toUpperCase().slice(0, 30), M + 16, y);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...color);
    doc.text(`${b.score}`, W - M, y, { align: "right" });
    y += 2.5;
    doc.setDrawColor(...color);
    doc.setLineWidth(1.1);
    doc.line(M + 16, y, M + 16 + ((W - M - 16 - 30) * b.score) / 100, y);
    y += 5;
  }

  // ── actions ──────────────────────────────────────────────────
  y += 6;
  if (y > 240) {
    doc.addPage();
    y = 26;
  }
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...SAND);
  doc.text("THE CLEANUP PATH", M, y);
  y += 6;
  result.aiActions.forEach((a, i) => {
    if (y > 278) return;
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...RUBY);
    doc.text(String(i + 1).padStart(2, "0"), M, y);
    doc.setFont("courier", "normal");
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(a, W - 2 * M - 12).slice(0, 2), M + 10, y);
    y += 6.5;
  });

  // ── footer ───────────────────────────────────────────────────
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(
    "NO STORAGE · NO TRACE · ENGINES ONLY — shadow.me",
    W / 2,
    290,
    { align: "center" }
  );

  doc.save(`shadow-blueprint-${result.id.slice(0, 8)}.pdf`);
}
