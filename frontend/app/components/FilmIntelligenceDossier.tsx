"use client";

import type { RefObject } from "react";
import type { MovieDossier } from "@/lib/api";
import { sentimentTextClass } from "./SentimentBreakdown";

function slug(title: string) {
  return title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

export function FilmIntelligenceDossier({
  dossier,
  exportRef,
}: {
  dossier: MovieDossier;
  exportRef: RefObject<HTMLDivElement | null>;
}) {
  const { movie, sentiment, aspects, consensus_blurb, driver_words, generated_at } = dossier;
  const pos = sentiment.positive_pct;
  const neg = sentiment.negative_pct;
  const neu = sentiment.neutral_pct;
  const gaugeRotation = Math.min(Math.max(pos, 5), 95) * 1.8 - 90;

  const generatedLabel = new Date(generated_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      ref={exportRef}
      className="w-[794px] bg-[#fffaf8] text-[#2d0911] p-10 box-border font-sans"
      style={{ fontFamily: "system-ui, Segoe UI, sans-serif" }}
    >
      <div className="flex items-start justify-between border-b border-[#2d0911]/15 pb-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#2d0911]/55 mb-1">
            CriticLens · Film intelligence dossier
          </p>
          <h1 className="text-2xl font-bold leading-tight">{movie.title}</h1>
          <p className="text-sm text-[#2d0911]/65 mt-1">
            {movie.year} · {movie.genre} · {movie.director}
          </p>
        </div>
        {movie.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt=""
            crossOrigin="anonymous"
            className="w-[100px] h-[150px] object-cover rounded-lg border border-[#2d0911]/15 shadow-sm shrink-0 ml-4"
          />
        ) : (
          <div className="w-[100px] h-[150px] rounded-lg bg-gradient-to-br from-[#f26c68] to-[#2d0911] shrink-0 ml-4" />
        )}
      </div>

      <div className="grid grid-cols-[180px_1fr] gap-8 mb-8">
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-20 overflow-hidden mb-2">
            <div className="absolute inset-0 rounded-t-full bg-[#fbe4de] border border-[#2d0911]/10" />
            <div
              className="absolute bottom-0 left-1/2 w-1 h-[72px] origin-bottom bg-[#2d0911]/80 rounded-full"
              style={{ transform: `translateX(-50%) rotate(${gaugeRotation}deg)` }}
            />
            <div className="absolute bottom-0 left-1/2 w-3 h-3 -translate-x-1/2 rounded-full bg-[#2d0911]" />
          </div>
          <p className={`text-lg font-bold ${sentimentTextClass(sentiment.overall_label)}`}>
            {sentiment.overall_label}
          </p>
          <p className="text-[11px] text-[#2d0911]/55 text-center mt-1">
            {sentiment.review_count} reviews · {sentiment.avg_confidence}% confidence
          </p>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wider text-[#2d0911]/55 mb-2">Audience consensus</h2>
          <p className="text-sm leading-relaxed text-[#2d0911]/85">{consensus_blurb}</p>
          <div className="mt-4 h-3 flex rounded-full overflow-hidden border border-[#2d0911]/10 bg-[#fbe4de]/60">
            <div className="bg-[#16a34a]" style={{ width: `${pos}%` }} />
            <div className="bg-[#dc2626]" style={{ width: `${neg}%` }} />
            <div className="bg-[#2d0911]/15" style={{ width: `${neu}%` }} />
          </div>
          <div className="flex justify-between text-[11px] mt-1.5 font-medium">
            <span className="text-[#16a34a]">Positive {pos.toFixed(1)}%</span>
            <span className="text-[#dc2626]">Negative {neg.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-[#2d0911]/55 mb-3">Aspect score breakdown</h2>
        <div className="space-y-3">
          {Object.entries(aspects).map(([aspect, score]) => (
            <div key={aspect}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{aspect}</span>
                <span className="font-mono text-[#2d0911]/65">{score}%</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-[#fbe4de]/80 border border-[#2d0911]/10 overflow-hidden">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#2d0911]/20" />
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    backgroundColor: score >= 50 ? "#16a34a" : "#dc2626",
                    left: score >= 50 ? "50%" : `${score}%`,
                    width: score >= 50 ? `${score - 50}%` : `${50 - score}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-[#16a34a] mb-2">Top positive drivers</h2>
          {driver_words.positive.length === 0 ? (
            <p className="text-xs text-[#2d0911]/45">No strong positive tokens in corpus.</p>
          ) : (
            <ul className="space-y-1.5">
              {driver_words.positive.map((item) => (
                <li
                  key={item.word}
                  className="flex justify-between text-sm border border-[#16a34a]/25 bg-[#16a34a]/8 rounded-lg px-2.5 py-1.5"
                >
                  <span className="font-medium">{item.word}</span>
                  <span className="font-mono text-xs text-[#16a34a]">+{item.weight.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-wider text-[#dc2626] mb-2">Top negative drivers</h2>
          {driver_words.negative.length === 0 ? (
            <p className="text-xs text-[#2d0911]/45">No strong negative tokens in corpus.</p>
          ) : (
            <ul className="space-y-1.5">
              {driver_words.negative.map((item) => (
                <li
                  key={item.word}
                  className="flex justify-between text-sm border border-[#dc2626]/25 bg-[#dc2626]/8 rounded-lg px-2.5 py-1.5"
                >
                  <span className="font-medium">{item.word}</span>
                  <span className="font-mono text-xs text-[#dc2626]">{item.weight.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[#2d0911]/45 border-t border-[#2d0911]/10 pt-3">
        Generated {generatedLabel} · CriticLens ML sentiment audit · {slug(movie.title)}.pdf
      </p>
    </div>
  );
}
