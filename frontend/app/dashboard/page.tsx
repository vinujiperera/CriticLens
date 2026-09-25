"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  BookOpen,
  Split,
  Layers,
  Sliders,
  RotateCcw,
  History,
  LineChart as LineChartIcon,
  BarChart3,
} from "lucide-react";

interface AspectScores {
  [key: string]: number | null;
}

interface TrajectoryPoint {
  sentence_index: number;
  snippet: string;
  compound: number;
  pos: number;
  neg: number;
  neu: number;
}

interface TokenImpact {
  word: string;
  weight: number;
  influence: "Positive" | "Negative" | "Neutral";
}

interface LexicalMetrics {
  word_count: number;
  sentence_count: number;
  lexical_diversity_pct: number;
  reading_ease: number;
  contrast_marker_count: number;
  estimated_read_time_sec: number;
}

interface AnalysisResult {
  id: number;
  text: string;
  sentiment: "Positive" | "Negative";
  confidence: number;
  breakdown: {
    positive: number;
    negative: number;
  };
  analytics: {
    aspects: AspectScores;
    trajectory: TrajectoryPoint[];
    token_impacts: TokenImpact[];
    lexical: LexicalMetrics;
  };
}

interface HistoryItem {
  id: number;
  text: string;
  sentiment: string;
  confidence: number;
  timestamp?: string;
}

const API_BASE = "http://127.0.0.1:8000";

const SAMPLE_REVIEWS = [
  {
    label: "Mixed Critique",
    text: "The cinematography and visuals were stunning with vivid lighting. However, the plot was terribly slow and the acting felt lifeless.",
  },
  {
    label: "Masterpiece",
    text: "An absolute tour de force! The script was brilliantly written, pacing was relentless, and the lead actor gave a career-defining performance.",
  },
];

function SectionHeader({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-4 pb-3 border-b border-sunrise-burgundy/10">
      <h3 className="text-sm font-semibold text-sunrise-burgundy flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sunrise-coral/15 border border-sunrise-coral/25">
          <Icon className="w-4 h-4 text-sunrise-coral" />
        </span>
        <span className="leading-snug">{title}</span>
      </h3>
      {hint && <p className="text-xs text-sunrise-burgundy/55 mt-2 pl-10">{hint}</p>}
    </div>
  );
}

function TrajectoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TrajectoryPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="max-w-[220px] rounded-xl border border-sunrise-coral/40 bg-sunrise-surface px-3 py-2 shadow-lg text-[11px] text-sunrise-burgundy">
      <p className="font-semibold text-sunrise-coral mb-1">Sentence {point.sentence_index}</p>
      <p className="leading-relaxed mb-2 opacity-90">&ldquo;{point.snippet}&rdquo;</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px]">
        <span>Compound: {point.compound}</span>
        <span>Pos: {point.pos}%</span>
        <span>Neg: {point.neg}%</span>
        <span>Neu: {point.neu}%</span>
      </div>
    </div>
  );
}

function tokenStyles(token: TokenImpact) {
  if (token.weight > 0.15) {
    return "bg-sunrise-coral/15 text-sunrise-coral border-sunrise-coral/35";
  }
  if (token.weight < -0.15) {
    return "bg-sunrise-coral-muted/20 text-[#c47275] border-sunrise-coral-muted/40";
  }
  return "text-sunrise-burgundy/75 border-sunrise-burgundy/10 hover:bg-white/50";
}

function formatHistoryTime(ts?: string) {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hoverToken, setHoverToken] = useState<TokenImpact | null>(null);
  const [pinnedToken, setPinnedToken] = useState<TokenImpact | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // Backend offline
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = window.setInterval(fetchHistory, 15000);
    return () => window.clearInterval(interval);
  }, [fetchHistory]);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const targetText = (textToAnalyze ?? inputText).trim();
    if (!targetText) return;

    setLoading(true);
    setHoverToken(null);
    setPinnedToken(null);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: targetText }),
      });

      if (res.ok) {
        const data: AnalysisResult = await res.json();
        setResult(data);
        fetchHistory();
      }
    } catch (err) {
      console.error("Inference request failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const activeToken = pinnedToken ?? hoverToken;

  return (
    <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
      <div className="max-w-6xl mx-auto mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sunrise-burgundy/15 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-sunrise-burgundy flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sunrise-coral text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </span>
            Review analyzer
          </h1>
          <p className="text-sm text-sunrise-burgundy/60 mt-1 ml-11 max-w-xl">
            Paste any critique to see overall sentiment, topic scores, how tone shifts line by line, which
            words mattered most, reading stats, and your recent analyses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_REVIEWS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setInputText(sample.text);
                handleAnalyze(sample.text);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-sunrise-burgundy/15 bg-sunrise-surface hover:border-sunrise-coral/50 text-sunrise-burgundy transition-all"
            >
              Load {sample.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div
            id="analyze"
            className="scroll-mt-24 bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-5 shadow-lg space-y-3"
          >
            <label className="block text-xs uppercase tracking-wider font-semibold text-sunrise-burgundy/70">
              Your review or critique
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste a review, critique blurb, or narrative passage..."
              className="w-full bg-sunrise-peach/30 border border-sunrise-burgundy/15 focus:border-sunrise-coral focus:ring-2 focus:ring-sunrise-coral/30 rounded-xl p-3.5 text-sm text-sunrise-burgundy placeholder-sunrise-burgundy/40 outline-none transition-all resize-none"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setInputText("");
                  setResult(null);
                  setPinnedToken(null);
                }}
                className="flex items-center gap-1.5 text-xs text-sunrise-burgundy/55 hover:text-sunrise-burgundy transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>

              <button
                type="button"
                disabled={loading || !inputText.trim()}
                onClick={() => handleAnalyze()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sunrise-coral hover:bg-[#e85f5b] disabled:opacity-40 text-white font-medium text-sm transition-all shadow-md"
              >
                {loading ? "Analyzing…" : "Analyze review"}
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-5 shadow-lg">
              <SectionHeader
                title="Which words influenced the score?"
                hint="Hover a word for a quick explanation. Click to keep it selected below."
                icon={Sliders}
              />

              <div className="relative p-4 bg-sunrise-peach/25 rounded-xl border border-sunrise-burgundy/10 max-h-64 overflow-y-auto text-sm leading-loose text-sunrise-burgundy">
                {result.analytics.token_impacts.map((token, idx) => (
                  <span key={`${token.word}-${idx}`} className="relative inline">
                    <button
                      type="button"
                      className={`relative mx-0.5 px-1.5 py-0.5 rounded-md border text-xs transition-all ${tokenStyles(token)} ${
                        activeToken?.word === token.word && activeToken.weight === token.weight
                          ? "ring-2 ring-sunrise-coral/50"
                          : ""
                      }`}
                      onMouseEnter={() => setHoverToken(token)}
                      onMouseLeave={() => setHoverToken(null)}
                      onClick={() => setPinnedToken((prev) => (prev?.word === token.word ? null : token))}
                    >
                      {token.word}
                      {hoverToken?.word === token.word &&
                        hoverToken.weight === token.weight &&
                        !pinnedToken && (
                          <span
                            className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] whitespace-nowrap rounded-lg bg-sunrise-burgundy text-sunrise-cream px-2.5 py-1.5 text-[10px] font-medium shadow-lg"
                            role="tooltip"
                          >
                            <span className="text-sunrise-coral">{token.influence}</span>
                            <span className="mx-1.5 opacity-40">|</span>
                            weight{" "}
                            <span className="font-mono">
                              {token.weight > 0 ? `+${token.weight}` : token.weight}
                            </span>
                          </span>
                        )}
                    </button>
                  </span>
                ))}
              </div>

              <div className="mt-3.5 min-h-[42px] flex flex-wrap items-center justify-between gap-2 text-xs px-3.5 py-2.5 rounded-lg bg-sunrise-peach/30 border border-sunrise-burgundy/10">
                {activeToken ? (
                  <>
                    <span className="text-sunrise-burgundy">
                      Auditing: <strong>&ldquo;{activeToken.word}&rdquo;</strong>
                      {pinnedToken && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-sunrise-coral">
                          pinned
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-sunrise-burgundy/80">
                      {activeToken.influence} ·{" "}
                      <span
                        className={
                          activeToken.weight > 0
                            ? "text-sunrise-coral"
                            : activeToken.weight < 0
                              ? "text-sunrise-coral-muted"
                              : ""
                        }
                      >
                        {activeToken.weight > 0 ? `+${activeToken.weight}` : activeToken.weight}
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="text-sunrise-burgundy/45 italic">
                    Hover tokens for live badges, or click to pin an audit row
                  </span>
                )}
              </div>
            </div>
          )}

          <div
            id="history"
            className="scroll-mt-24 bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-5 shadow-lg"
          >
            <SectionHeader
              title="Your recent analyses"
              hint="Click a row to load it again. Use Delete to remove an entry."
              icon={History}
            />

            {history.length === 0 ? (
              <p className="text-xs text-sunrise-burgundy/45 py-4 text-center">No stored evaluations yet.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-sunrise-peach/30 border border-sunrise-burgundy/10 hover:border-sunrise-coral/35 transition-colors"
                  >
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => setInputText(item.text)}
                      title="Load into editor"
                    >
                      <p className="text-xs text-sunrise-burgundy line-clamp-2">{item.text}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-semibold ${
                            item.sentiment === "Positive" ? "text-sunrise-coral" : "text-sunrise-coral-muted"
                          }`}
                        >
                          {item.sentiment} ({item.confidence}%)
                        </span>
                        {formatHistoryTime(item.timestamp) && (
                          <span className="text-[10px] text-sunrise-burgundy/45 font-mono">
                            {formatHistoryTime(item.timestamp)}
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHistory(item.id)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg border border-sunrise-coral-muted/50 text-[10px] font-bold uppercase tracking-wide text-sunrise-coral-muted hover:bg-sunrise-coral-muted/15 hover:text-[#c47275] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          {result ? (
            <>
              <div className="bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-sunrise-burgundy/55">
                      Primary classification
                    </span>
                    <h2 className="text-2xl font-black text-sunrise-burgundy flex items-center gap-2 mt-0.5">
                      {result.sentiment === "Positive" ? (
                        <>
                          <TrendingUp className="w-6 h-6 text-sunrise-coral" />
                          <span className="text-sunrise-coral">Positive</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-6 h-6 text-sunrise-coral-muted" />
                          <span className="text-[#c47275]">Negative</span>
                        </>
                      )}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-sunrise-burgundy/55">Confidence</span>
                    <p className="text-2xl font-mono font-bold text-sunrise-burgundy">{result.confidence}%</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2.5 w-full bg-sunrise-peach/50 rounded-full overflow-hidden flex border border-sunrise-burgundy/10">
                    <div
                      style={{ width: `${result.breakdown.negative}%` }}
                      className="bg-sunrise-coral-muted transition-all duration-700 ease-out"
                    />
                    <div
                      style={{ width: `${result.breakdown.positive}%` }}
                      className="bg-sunrise-coral transition-all duration-700 ease-out"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono mt-1.5 text-sunrise-burgundy/55">
                    <span>Neg {result.breakdown.negative}%</span>
                    <span>Pos {result.breakdown.positive}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-5 shadow-lg">
                <SectionHeader
                  title="How readable is this review?"
                  hint="Ease of reading, “but/however” flip phrases, and vocabulary variety."
                  icon={BookOpen}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-sunrise-burgundy/10 bg-sunrise-peach/25 p-4 text-center">
                    <BookOpen className="w-4 h-4 mx-auto text-sunrise-coral mb-2" />
                    <span className="text-[10px] uppercase tracking-wide text-sunrise-burgundy/55 block">
                      Reading ease
                    </span>
                    <span className="text-xl font-bold text-sunrise-burgundy font-mono mt-1 block">
                      {result.analytics.lexical.reading_ease}
                    </span>
                    <span className="text-[10px] text-sunrise-burgundy/45">reading ease</span>
                  </div>
                  <div className="rounded-xl border border-sunrise-burgundy/10 bg-sunrise-peach/25 p-4 text-center">
                    <Split className="w-4 h-4 mx-auto text-sunrise-coral-muted mb-2" />
                    <span className="text-[10px] uppercase tracking-wide text-sunrise-burgundy/55 block">
                      Tone shifts
                    </span>
                    <span className="text-xl font-bold text-sunrise-burgundy font-mono mt-1 block">
                      {result.analytics.lexical.contrast_marker_count}
                    </span>
                    <span className="text-[10px] text-sunrise-burgundy/45">but / however / yet…</span>
                  </div>
                  <div className="rounded-xl border border-sunrise-burgundy/10 bg-sunrise-peach/25 p-4 text-center">
                    <Layers className="w-4 h-4 mx-auto text-sunrise-coral mb-2" />
                    <span className="text-[10px] uppercase tracking-wide text-sunrise-burgundy/55 block">
                      Word variety
                    </span>
                    <span className="text-xl font-bold text-sunrise-burgundy font-mono mt-1 block">
                      {result.analytics.lexical.lexical_diversity_pct}%
                    </span>
                    <span className="text-[10px] text-sunrise-burgundy/45">unique / total words</span>
                  </div>
                </div>
              </div>

              <div className="bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-5 shadow-lg">
                <SectionHeader
                  title="Scores by topic"
                  hint="Acting, story, visuals, and pacing—when your review mentions them."
                  icon={BarChart3}
                />
                <div className="flex flex-col gap-4">
                  {Object.entries(result.analytics.aspects).map(([aspect, score]) => (
                    <div key={aspect}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-sunrise-burgundy font-medium">{aspect}</span>
                        <span className="font-mono text-[11px] text-sunrise-burgundy/60">
                          {score !== null ? `${score}%` : "Not mentioned"}
                        </span>
                      </div>
                      <div className="relative h-3 w-full rounded-full bg-sunrise-peach/50 border border-sunrise-burgundy/10 overflow-hidden">
                        <div
                          className="absolute top-0 bottom-0 w-px bg-sunrise-burgundy/25 z-10"
                          style={{ left: "50%" }}
                          aria-hidden
                        />
                        {score !== null ? (
                          <div
                            className={`absolute top-0 bottom-0 transition-all duration-700 ease-out ${
                              score >= 50 ? "bg-sunrise-coral" : "bg-sunrise-coral-muted"
                            }`}
                            style={
                              score >= 50
                                ? { left: "50%", width: `${score - 50}%` }
                                : { left: `${score}%`, width: `${50 - score}%` }
                            }
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(45,9,17,0.06)_6px,rgba(45,9,17,0.06)_12px)]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-sunrise-surface/95 border border-sunrise-burgundy/12 rounded-2xl p-5 shadow-lg">
                <SectionHeader
                  title="How mood changes across the review"
                  hint="Each sentence’s tone from start to finish (great for mixed reviews)."
                  icon={LineChartIcon}
                />
                {result.analytics.trajectory.length === 0 ? (
                  <p className="text-xs text-sunrise-burgundy/45 text-center py-8">
                    Use a review with several sentences to see the line chart.
                  </p>
                ) : (
                  <div className="h-52 w-full rounded-xl bg-sunrise-peach/20 border border-sunrise-burgundy/10 p-2 pt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={result.analytics.trajectory}
                        margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="4 4" stroke="#e5989b44" vertical={false} />
                        <XAxis
                          dataKey="sentence_index"
                          stroke="#2d0911"
                          tick={{ fill: "#2d0911", fontSize: 10, opacity: 0.65 }}
                          tickFormatter={(v) => `S${v}`}
                          axisLine={{ stroke: "#2d091122" }}
                        />
                        <YAxis
                          domain={[-1, 1]}
                          ticks={[-1, -0.5, 0, 0.5, 1]}
                          stroke="#2d0911"
                          tick={{ fill: "#2d0911", fontSize: 10, opacity: 0.65 }}
                          axisLine={{ stroke: "#2d091122" }}
                        />
                        <ReferenceLine y={0} stroke="#f26c68" strokeDasharray="3 3" strokeOpacity={0.6} />
                        <Tooltip content={<TrajectoryTooltip />} cursor={{ stroke: "#f26c68", strokeWidth: 1 }} />
                        <Line
                          type="monotone"
                          dataKey="compound"
                          name="Compound"
                          stroke="#f26c68"
                          strokeWidth={2.5}
                          dot={{ fill: "#fffaf8", stroke: "#f26c68", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 7, fill: "#f26c68", stroke: "#2d0911", strokeWidth: 1 }}
                          animationDuration={800}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full min-h-[420px] border border-dashed border-sunrise-burgundy/20 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-sunrise-burgundy/45">
              <Sparkles className="w-10 h-10 mb-3 text-sunrise-coral/40" />
              <p className="text-sm font-medium text-sunrise-burgundy/80">Ready to analyze</p>
              <p className="text-xs max-w-sm mt-2 leading-relaxed">
                Paste a review and click Analyze to see topic scores, the mood chart, important words,
                reading stats, and saved history here.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
