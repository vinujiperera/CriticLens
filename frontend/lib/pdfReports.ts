import { jsPDF } from "jspdf";
import type { MovieDossier } from "./api";

const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [220, 38, 38];
const INK: [number, number, number] = [45, 9, 17];
const MUTED: [number, number, number] = [100, 70, 78];

function writeWrapped(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export type ReviewExportPayload = {
  contextTitle?: string;
  contextSubtitle?: string;
  author?: string;
  reviewText: string;
  sentiment: string;
  confidence: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  aspects: Record<string, number | null>;
  driver_words: {
    positive: { word: string; weight: number }[];
    negative: { word: string; weight: number }[];
  };
};

export function downloadMovieDossierPdf(dossier: MovieDossier, filename: string) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  pdf.setTextColor(...INK);
  pdf.setFontSize(9);
  pdf.text("CRITICLENS · FILM INTELLIGENCE DOSSIER", margin, y);
  y += 18;

  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(dossier.movie.title, margin, y);
  y += 22;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED);
  pdf.text(
    `${dossier.movie.year} · ${dossier.movie.genre} · ${dossier.movie.director}`,
    margin,
    y
  );
  y += 28;

  pdf.setTextColor(...INK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Primary sentiment", margin, y);
  y += 14;

  const label = dossier.sentiment.overall_label;
  if (label === "Positive") pdf.setTextColor(...GREEN);
  else if (label === "Negative") pdf.setTextColor(...RED);
  else pdf.setTextColor(...INK);
  pdf.setFontSize(16);
  pdf.text(`${label}`, margin, y);
  y += 18;

  pdf.setFontSize(10);
  pdf.setTextColor(...MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `${dossier.sentiment.review_count} reviews · ${dossier.sentiment.avg_confidence}% avg confidence`,
    margin,
    y
  );
  y += 16;

  pdf.setTextColor(...GREEN);
  pdf.text(`Positive ${dossier.sentiment.positive_pct.toFixed(1)}%`, margin, y);
  pdf.setTextColor(...RED);
  pdf.text(`Negative ${dossier.sentiment.negative_pct.toFixed(1)}%`, margin + 120, y);
  pdf.setTextColor(...MUTED);
  pdf.text(`Neutral ${dossier.sentiment.neutral_pct.toFixed(1)}%`, margin + 240, y);
  y += 22;

  pdf.setTextColor(...INK);
  pdf.setFont("helvetica", "bold");
  pdf.text("Consensus", margin, y);
  y += 14;
  pdf.setFont("helvetica", "normal");
  y = writeWrapped(pdf, dossier.consensus_blurb, margin, y, width, 13) + 10;

  pdf.setFont("helvetica", "bold");
  pdf.text("Aspect scores", margin, y);
  y += 14;
  pdf.setFont("helvetica", "normal");
  for (const [aspect, score] of Object.entries(dossier.aspects)) {
    const color = score >= 50 ? GREEN : RED;
    pdf.setTextColor(...color);
    pdf.text(`${aspect}: ${score}%`, margin, y);
    y += 13;
    if (y > pdf.internal.pageSize.getHeight() - 120) {
      pdf.addPage();
      y = margin;
    }
  }
  y += 8;

  pdf.setTextColor(...GREEN);
  pdf.setFont("helvetica", "bold");
  pdf.text("Top positive driver words", margin, y);
  y += 14;
  pdf.setFont("helvetica", "normal");
  if (dossier.driver_words.positive.length === 0) {
    pdf.setTextColor(...MUTED);
    pdf.text("—", margin, y);
    y += 13;
  } else {
    for (const item of dossier.driver_words.positive) {
      pdf.setTextColor(...GREEN);
      pdf.text(`${item.word} (+${item.weight.toFixed(2)})`, margin, y);
      y += 13;
    }
  }
  y += 6;

  pdf.setTextColor(...RED);
  pdf.setFont("helvetica", "bold");
  pdf.text("Top negative driver words", margin, y);
  y += 14;
  pdf.setFont("helvetica", "normal");
  if (dossier.driver_words.negative.length === 0) {
    pdf.setTextColor(...MUTED);
    pdf.text("—", margin, y);
  } else {
    for (const item of dossier.driver_words.negative) {
      pdf.setTextColor(...RED);
      pdf.text(`${item.word} (${item.weight.toFixed(2)})`, margin, y);
      y += 13;
    }
  }

  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text(
    `Generated ${new Date(dossier.generated_at).toLocaleString()} · CriticLens ML audit`,
    margin,
    pdf.internal.pageSize.getHeight() - 32
  );

  pdf.save(filename);
}

export function downloadReviewReportPdf(payload: ReviewExportPayload, filename: string) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  pdf.setTextColor(...INK);
  pdf.setFontSize(9);
  pdf.text("CRITICLENS · REVIEW ANALYSIS REPORT", margin, y);
  y += 18;

  if (payload.contextTitle) {
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(payload.contextTitle, margin, y);
    y += 20;
  }
  if (payload.contextSubtitle) {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED);
    pdf.text(payload.contextSubtitle, margin, y);
    y += 18;
  }

  if (payload.author) {
    pdf.setTextColor(...INK);
    pdf.text(`Author: ${payload.author}`, margin, y);
    y += 16;
  }

  pdf.setFont("helvetica", "bold");
  pdf.text("Review text", margin, y);
  y += 14;
  pdf.setFont("helvetica", "normal");
  y = writeWrapped(pdf, payload.reviewText, margin, y, width, 13) + 12;

  pdf.setFont("helvetica", "bold");
  pdf.text("Classification", margin, y);
  y += 14;
  pdf.setFontSize(14);
  if (payload.sentiment === "Positive") pdf.setTextColor(...GREEN);
  else pdf.setTextColor(...RED);
  pdf.text(`${payload.sentiment} · ${payload.confidence.toFixed(1)}% confidence`, margin, y);
  y += 20;

  pdf.setFontSize(10);
  pdf.setTextColor(...GREEN);
  pdf.text(`Positive ${payload.positive_pct.toFixed(1)}%`, margin, y);
  pdf.setTextColor(...RED);
  pdf.text(`Negative ${payload.negative_pct.toFixed(1)}%`, margin + 120, y);
  pdf.setTextColor(...MUTED);
  pdf.text(`Neutral ${payload.neutral_pct.toFixed(1)}%`, margin + 240, y);
  y += 22;

  pdf.setTextColor(...INK);
  pdf.setFont("helvetica", "bold");
  pdf.text("Aspect scores", margin, y);
  y += 14;
  pdf.setFont("helvetica", "normal");
  for (const [aspect, score] of Object.entries(payload.aspects)) {
    if (score === null) continue;
    pdf.setTextColor(...(score >= 50 ? GREEN : RED));
    pdf.text(`${aspect}: ${score}%`, margin, y);
    y += 13;
  }
  y += 8;

  pdf.setTextColor(...GREEN);
  pdf.setFont("helvetica", "bold");
  pdf.text("Positive drivers", margin, y);
  y += 14;
  pdf.setFont("helvetica", "normal");
  for (const item of payload.driver_words.positive.slice(0, 8)) {
    pdf.setTextColor(...GREEN);
    pdf.text(`${item.word} (+${item.weight.toFixed(2)})`, margin, y);
    y += 13;
  }
  y += 6;

  pdf.setTextColor(...RED);
  pdf.setFont("helvetica", "bold");
  pdf.text("Negative drivers", margin, y);
  y += 14;
  pdf.setFont("helvetica", "normal");
  for (const item of payload.driver_words.negative.slice(0, 8)) {
    pdf.text(`${item.word} (${item.weight.toFixed(2)})`, margin, y);
    y += 13;
  }

  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text(`Generated ${new Date().toLocaleString()} · CriticLens`, margin, pdf.internal.pageSize.getHeight() - 32);

  pdf.save(filename);
}
