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
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Scikit-Learn + TF-IDF Pipeline
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
            Critique<span className="text-indigo-400">Lens</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Instant sentiment breakdown and confidence gauge for film, novel, and media critique.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <textarea
            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none text-sm sm:text-base"
            placeholder="Paste or write a critique here..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Try sample:</span>
              {sampleReviews.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setReview(sample)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-800/40 transition"
                >
                  Sample {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !review.trim()}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-600/20 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Review"}
            </button>
          </div>
        </div>

        {/* Inference Results Card */}
        {result && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.sentiment === "Positive" ? (
                  <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <ThumbsUp className="w-6 h-6" />
                  </span>
                ) : (
                  <span className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                    <ThumbsDown className="w-6 h-6" />
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {result.sentiment} Sentiment
                  </h3>
                  <p className="text-xs text-slate-400">Model Confidence: {result.confidence}%</p>
                </div>
              </div>
            </div>

            {/* Probability Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-400">Negative ({result.breakdown.negative}%)</span>
                <span className="text-emerald-400">Positive ({result.breakdown.positive}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
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
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <History className="w-4 h-4" />
              <span>Recent Queries (SQLite)</span>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-sm gap-4"
                >
                  <p className="truncate text-slate-300 flex-1">{item.text}</p>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                      item.sentiment === "Positive"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
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