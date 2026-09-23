"use client";

import { useState, useEffect } from "react";
import { Sparkles, History, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

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

export default function Home() {
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/history?limit=5");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // Backend not reached yet
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAnalyze = async () => {
    if (!review.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: review }),
      });

      if (!res.ok) throw new Error("Failed to analyze review");

      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (err) {
      alert("Error contacting ML backend. Ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const sampleReviews = [
    "A visual masterpiece with remarkable character depth and brilliant sound design.",
    "The dialogue was wooden, the pacing was agonizing, and the ending felt entirely unearned."
  ];

  return (
    <main className="min-h-screen bg-sunrise-cream text-sunrise-burgundy py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 rounded-3xl bg-sunrise-coral px-6 py-10 sm:px-10 shadow-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sunrise-peach/90 text-sunrise-burgundy border border-sunrise-burgundy/15">
            <Sparkles className="w-3.5 h-3.5" /> Scikit-Learn + TF-IDF Pipeline
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-sunrise-burgundy">
            Critic<span className="text-white">Lens</span>
          </h1>
          <p className="text-sunrise-burgundy/85 max-w-xl mx-auto text-sm sm:text-base">
            Instant sentiment breakdown and confidence gauge for film, novel, and media critique.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white/70 border border-sunrise-burgundy/15 rounded-2xl p-6 shadow-md space-y-4 backdrop-blur-sm">
          <textarea
            className="w-full h-32 bg-sunrise-peach/40 border border-sunrise-burgundy/20 rounded-xl p-4 text-sunrise-burgundy placeholder-sunrise-burgundy/45 focus:outline-none focus:ring-2 focus:ring-sunrise-coral transition resize-none text-sm sm:text-base"
            placeholder="Paste or write a critique here..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-sunrise-burgundy/55">Try sample:</span>
              {sampleReviews.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setReview(sample)}
                  className="text-xs text-sunrise-burgundy hover:text-sunrise-coral bg-sunrise-peach/60 px-2.5 py-1 rounded-md border border-sunrise-burgundy/15 transition"
                >
                  Sample {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !review.trim()}
              className="inline-flex items-center justify-center gap-2 bg-sunrise-burgundy hover:bg-sunrise-burgundy/90 disabled:bg-sunrise-burgundy/30 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-sunrise-burgundy/25 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Review"}
            </button>
          </div>
        </div>

        {/* Inference Results Card */}
        {result && (
          <div className="bg-white/70 border border-sunrise-burgundy/15 rounded-2xl p-6 shadow-md space-y-5 animate-in fade-in duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.sentiment === "Positive" ? (
                  <span className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
                    <ThumbsUp className="w-6 h-6" />
                  </span>
                ) : (
                  <span className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl border border-rose-500/20">
                    <ThumbsDown className="w-6 h-6" />
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-sunrise-burgundy leading-tight">
                    {result.sentiment} Sentiment
                  </h3>
                  <p className="text-xs text-sunrise-burgundy/60">Model Confidence: {result.confidence}%</p>
                </div>
              </div>
            </div>

            {/* Probability Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-600">Negative ({result.breakdown.negative}%)</span>
                <span className="text-emerald-600">Positive ({result.breakdown.positive}%)</span>
              </div>
              <div className="w-full h-3 bg-sunrise-peach/50 rounded-full overflow-hidden flex border border-sunrise-burgundy/15">
                <div
                  style={{ width: `${result.breakdown.negative}%` }}
                  className="bg-rose-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${result.breakdown.positive}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sunrise-burgundy/70 text-sm font-medium">
              <History className="w-4 h-4" />
              <span>Recent Queries (SQLite)</span>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-sunrise-peach/50 border border-sunrise-burgundy/12 rounded-xl flex items-center justify-between text-sm gap-4"
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
