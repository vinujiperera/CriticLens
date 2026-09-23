"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  History,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  X,
  Copy,
  Check,
  RefreshCw,
  CircleAlert,
} from "lucide-react";
import { BrandLogo } from "./components/BrandLogo";

interface AnalysisResult {
  id?: number;
  text: string;
  sentiment: "Positive" | "Negative";
  confidence: number;
  breakdown: {
    positive: number;
    negative: number;
  };
}

interface HistoryItem {
  id: number;
  text: string;
  sentiment: string;
  confidence: number;
}

const MIN_REVIEW_LENGTH = 3;
const API_BASE = "http://127.0.0.1:8000";

export default function Home() {
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const trimmedLength = review.trim().length;
  const canAnalyze = trimmedLength >= MIN_REVIEW_LENGTH && !loading;

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history?limit=5`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: review }),
      });

      if (!res.ok) {
        const detail =
          res.status === 422
            ? "Review is too short. Enter at least 3 characters."
            : "Failed to analyze review.";
        throw new Error(detail);
      }

      const data = await res.json();
      setResult(data);
      setBackendOnline(true);
      fetchHistory();
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    } catch (err) {
      setBackendOnline(false);
      setError(
        err instanceof Error
          ? err.message
          : "Error contacting ML backend. Ensure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const clearInput = () => {
    setReview("");
    setError(null);
  };

  const loadFromHistory = (text: string) => {
    setReview(text);
    setError(null);
  };

  const copyResultSummary = async () => {
    if (!result) return;
    const summary = `${result.sentiment} (${result.confidence}% confidence) — Positive ${result.breakdown.positive}%, Negative ${result.breakdown.negative}%`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const sampleReviews = [
    {
      label: "Positive",
      text: "A visual masterpiece with remarkable character depth and brilliant sound design.",
    },
    {
      label: "Negative",
      text: "The dialogue was wooden, the pacing was agonizing, and the ending felt entirely unearned.",
    },
  ] as const;

  return (
    <main className="flex-1 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden text-center space-y-5 rounded-3xl bg-sunrise-burgundy px-6 py-10 sm:px-10 shadow-xl shadow-sunrise-burgundy/25 ring-1 ring-white/10">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(242,108,104,0.35),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex justify-center">
            <BrandLogo href={null} variant="hero" priority />
          </div>
          <div className="relative flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-sunrise-cream border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-sunrise-coral" /> Scikit-Learn + TF-IDF Pipeline
            </span>
            {backendOnline !== null && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  backendOnline
                    ? "bg-sunrise-coral/20 text-sunrise-cream border-sunrise-coral/40"
                    : "bg-sunrise-coral-muted/25 text-sunrise-peach border-sunrise-coral-muted/50"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${backendOnline ? "bg-sunrise-coral" : "bg-sunrise-coral-muted"}`}
                  aria-hidden
                />
                {backendOnline ? "Backend connected" : "Backend offline"}
              </span>
            )}
          </div>
          <p className="relative text-sunrise-cream/90 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Instant sentiment breakdown and confidence gauge for film, novel, and media critique.
          </p>
        </div>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-24 grid sm:grid-cols-3 gap-4"
          aria-labelledby="how-it-works-heading"
        >
          <h2 id="how-it-works-heading" className="sr-only">
            How it works
          </h2>
          {[
            { step: "1", title: "Paste your review", desc: "Write or paste a critique—films, books, or any media." },
            { step: "2", title: "Run analysis", desc: "Our TF-IDF model scores positive vs. negative tone." },
            { step: "3", title: "Read the breakdown", desc: "See confidence, percentages, and saved history." },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-sunrise-burgundy/10 bg-sunrise-surface/90 p-5 shadow-md shadow-sunrise-burgundy/5"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sunrise-coral/20 text-sm font-bold text-sunrise-burgundy">
                {item.step}
              </span>
              <h3 className="mt-3 font-semibold text-sunrise-burgundy">{item.title}</h3>
              <p className="mt-1 text-sm text-sunrise-burgundy/65 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Input Card */}
        <div
          id="analyze"
          className="scroll-mt-24 bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-6 shadow-lg shadow-sunrise-burgundy/8 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="review-input" className="text-sm font-medium text-sunrise-burgundy">
              Your critique
            </label>
            <span
              className={`text-xs tabular-nums ${
                trimmedLength > 0 && trimmedLength < MIN_REVIEW_LENGTH
                  ? "text-sunrise-coral-muted"
                  : "text-sunrise-burgundy/55"
              }`}
            >
              {trimmedLength} characters
              {trimmedLength > 0 && trimmedLength < MIN_REVIEW_LENGTH && ` (min ${MIN_REVIEW_LENGTH})`}
            </span>
          </div>

          <div className="relative">
            <textarea
              id="review-input"
              className="w-full h-36 sm:h-32 bg-sunrise-peach/40 border border-sunrise-burgundy/20 rounded-xl p-4 pr-10 text-sunrise-burgundy placeholder-sunrise-burgundy/45 focus:outline-none focus:ring-2 focus:ring-sunrise-coral transition resize-y text-sm sm:text-base disabled:opacity-60"
              placeholder="Paste or write a critique here..."
              value={review}
              onChange={(e) => {
                setReview(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              aria-describedby="review-hint"
            />
            {review.length > 0 && (
              <button
                type="button"
                onClick={clearInput}
                disabled={loading}
                className="absolute top-3 right-3 p-1 rounded-md text-sunrise-burgundy/50 hover:text-sunrise-burgundy hover:bg-sunrise-peach/80 transition disabled:opacity-40"
                aria-label="Clear text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p id="review-hint" className="text-xs text-sunrise-burgundy/55">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-sunrise-peach/60 border border-sunrise-burgundy/15 font-mono text-[10px]">Ctrl</kbd>
            {" + "}
            <kbd className="px-1.5 py-0.5 rounded bg-sunrise-peach/60 border border-sunrise-burgundy/15 font-mono text-[10px]">Enter</kbd>
            {" "}to analyze quickly.
          </p>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 text-sm text-sunrise-burgundy bg-sunrise-coral-muted/20 border border-sunrise-coral-muted/40 rounded-xl px-3 py-2.5"
            >
              <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-sunrise-burgundy/55">Try sample:</span>
              {sampleReviews.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setReview(sample.text);
                    setError(null);
                  }}
                  disabled={loading}
                  className="text-xs text-sunrise-burgundy hover:text-sunrise-coral bg-sunrise-peach/60 px-2.5 py-1 rounded-md border border-sunrise-burgundy/15 transition disabled:opacity-50"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="inline-flex items-center justify-center gap-2 bg-sunrise-coral hover:bg-[#e85f5b] disabled:bg-sunrise-coral/35 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-sunrise-coral/30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                "Analyze Review"
              )}
            </button>
          </div>
        </div>

        {/* Inference Results Card */}
        {result && (
          <div
            ref={resultsRef}
            className="bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-6 shadow-lg shadow-sunrise-burgundy/8 space-y-5 animate-in fade-in duration-300"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {result.sentiment === "Positive" ? (
                  <span className="p-2.5 bg-sunrise-coral/15 text-sunrise-coral rounded-xl border border-sunrise-coral/35 shrink-0">
                    <ThumbsUp className="w-6 h-6" />
                  </span>
                ) : (
                  <span className="p-2.5 bg-sunrise-coral-muted/20 text-[#c47275] rounded-xl border border-sunrise-coral-muted/45 shrink-0">
                    <ThumbsDown className="w-6 h-6" />
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-sunrise-burgundy leading-tight">
                    {result.sentiment} Sentiment
                  </h3>
                  <p className="text-xs text-sunrise-burgundy/60">Model Confidence: {result.confidence}%</p>
                </div>
              </div>
              <button
                type="button"
                onClick={copyResultSummary}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sunrise-burgundy bg-sunrise-peach/60 hover:bg-sunrise-peach px-3 py-1.5 rounded-lg border border-sunrise-burgundy/15 transition shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-sunrise-coral" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy summary
                  </>
                )}
              </button>
            </div>

            <blockquote className="text-sm text-sunrise-burgundy/80 border-l-2 border-sunrise-coral/60 pl-3 line-clamp-3">
              &ldquo;{result.text}&rdquo;
            </blockquote>

            {/* Probability Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#c47275]">Negative ({result.breakdown.negative}%)</span>
                <span className="text-sunrise-coral">Positive ({result.breakdown.positive}%)</span>
              </div>
              <div
                className="w-full h-3 bg-sunrise-peach/50 rounded-full overflow-hidden flex border border-sunrise-burgundy/15"
                role="img"
                aria-label={`Negative ${result.breakdown.negative} percent, positive ${result.breakdown.positive} percent`}
              >
                <div
                  style={{ width: `${result.breakdown.negative}%` }}
                  className="bg-sunrise-coral-muted transition-all duration-500"
                />
                <div
                  style={{ width: `${result.breakdown.positive}%` }}
                  className="bg-sunrise-coral transition-all duration-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        <section id="history" className="scroll-mt-24 space-y-3" aria-labelledby="history-heading">
          <h2 id="history-heading" className="sr-only">
            Recent history
          </h2>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sunrise-burgundy/70 text-sm font-medium">
              <History className="w-4 h-4" />
              <span>Recent Queries (SQLite)</span>
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={historyLoading}
              className="inline-flex items-center gap-1 text-xs text-sunrise-burgundy/70 hover:text-sunrise-burgundy disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadFromHistory(item.text)}
                  className="w-full text-left p-3.5 bg-sunrise-peach/50 border border-sunrise-burgundy/12 rounded-xl flex items-center justify-between text-sm gap-4 hover:bg-sunrise-peach/80 hover:border-sunrise-burgundy/20 transition focus:outline-none focus:ring-2 focus:ring-sunrise-coral/50"
                  title="Click to load this review into the editor"
                >
                  <p className="truncate text-sunrise-burgundy/90 flex-1">{item.text}</p>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                      item.sentiment === "Positive"
                        ? "bg-sunrise-coral/15 text-sunrise-coral border-sunrise-coral/30"
                        : "bg-sunrise-coral-muted/15 text-sunrise-coral-muted border-sunrise-coral-muted/30"
                    }`}
                  >
                    {item.sentiment} ({item.confidence}%)
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-sunrise-burgundy/55 bg-sunrise-peach/30 border border-dashed border-sunrise-burgundy/15 rounded-xl px-4 py-6 text-center">
              No history yet. Run your first analysis and it will appear here. Click any entry later to reuse it in
              the editor.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
