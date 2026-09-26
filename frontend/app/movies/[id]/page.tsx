"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ArrowLeft, BarChart3, Loader2, MessageSquarePlus } from "lucide-react";
import {
  fetchMovie,
  fetchMovieTrends,
  submitMovieReview,
  type MovieDetail,
  type SentimentTrendPoint,
} from "@/lib/api";
import { AspectGauges } from "../../components/AspectGauges";
import { MoviePoster } from "../../components/MoviePoster";
import { SentimentBreakdown } from "../../components/SentimentBreakdown";

export default function MovieDetailPage() {
  const params = useParams();
  const movieId = Number(params.id);

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [trends, setTrends] = useState<SentimentTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(movieId)) return;
    setLoading(true);
    try {
      const [detail, trendData] = await Promise.all([
        fetchMovie(movieId),
        fetchMovieTrends(movieId),
      ]);
      setMovie(detail);
      setTrends(trendData);
    } catch {
      setMovie(null);
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!reviewText.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitMovieReview(movieId, reviewText, authorName);
      setReviewText("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sunrise-coral" />
      </main>
    );
  }

  if (!movie) {
    return (
      <main className="flex-1 px-4 py-16 text-center">
        <p className="text-sunrise-burgundy/60">Movie not found.</p>
        <Link href="/movies" className="text-sunrise-coral text-sm mt-2 inline-block">
          Back to browse
        </Link>
      </main>
    );
  }

  const feed = movie.audience_feed ?? [];
  const showTmdbFeed = movie.reviews.length === 0 && feed.length > 0;
  const consensusHint =
    movie.audience_source === "tmdb"
      ? "Auto-analyzed from top TMDB community reviews"
      : movie.audience_source === "criticlens"
        ? "Based on CriticLens submissions"
        : undefined;

  return (
    <main className="flex-1 px-4 py-8 md:px-8 max-w-6xl mx-auto w-full space-y-8">
      <Link
        href="/movies"
        className="inline-flex items-center gap-1.5 text-sm text-sunrise-burgundy/60 hover:text-sunrise-burgundy"
      >
        <ArrowLeft className="w-4 h-4" /> All movies
      </Link>

      <div className="rounded-2xl overflow-hidden border border-sunrise-burgundy/12 shadow-lg">
        <MoviePoster
          posterUrl={movie.poster_url}
          posterAccent={movie.poster_accent}
          title={movie.title}
          genre={movie.genre}
          className="h-48 sm:h-64 md:h-72"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-sunrise-coral font-semibold">
              {movie.genre} · {movie.year}
              {movie.tmdb_id ? (
                <span className="ml-2 text-sunrise-burgundy/40 font-normal normal-case">
                  · TMDB #{movie.tmdb_id}
                </span>
              ) : null}
            </p>
            <h1 className="text-3xl font-bold text-sunrise-burgundy mt-1">{movie.title}</h1>
            <p className="text-sm text-sunrise-burgundy/55 mt-1">Directed by {movie.director}</p>
          </div>
          <p className="text-sm leading-relaxed text-sunrise-burgundy/80">{movie.synopsis}</p>

          <div className="rounded-2xl border border-sunrise-burgundy/12 bg-sunrise-surface p-5 shadow-md">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <MessageSquarePlus className="w-4 h-4 text-sunrise-coral" />
              Submit a review
            </h2>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full mb-2 px-3 py-2 rounded-lg border border-sunrise-burgundy/15 bg-sunrise-peach/20 text-sm"
            />
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your critique…"
              className="w-full px-3 py-2 rounded-lg border border-sunrise-burgundy/15 bg-sunrise-peach/20 text-sm resize-none"
            />
            {error && <p className="text-xs text-[#c47275] mt-2">{error}</p>}
            <button
              type="button"
              disabled={submitting || !reviewText.trim()}
              onClick={handleSubmit}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sunrise-coral text-white text-sm font-medium disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Post & analyze
            </button>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-sunrise-burgundy/80">
              {showTmdbFeed ? "Audience review feed" : `CriticLens reviews (${movie.reviews.length})`}
            </h2>
            {showTmdbFeed ? (
              <>
                <p className="text-xs text-sunrise-burgundy/50">
                  Pulled from TMDB and scored with the full CriticLens model on load—no manual
                  submissions required.
                </p>
                {feed.map((review, index) => (
                  <article
                    key={`feed-${index}-${review.author}`}
                    className="rounded-xl border border-sunrise-burgundy/10 bg-sunrise-peach/15 p-4"
                  >
                    <div className="flex justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold">{review.author}</span>
                      <span
                        className={`text-xs font-bold ${
                          review.sentiment === "Positive"
                            ? "text-sunrise-coral"
                            : "text-sunrise-coral-muted"
                        }`}
                      >
                        {review.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-sunrise-burgundy/85">{review.text}</p>
                    <SentimentBreakdown
                      compact
                      positive={review.positive_pct}
                      negative={review.negative_pct}
                      neutral={review.neutral_pct}
                    />
                  </article>
                ))}
              </>
            ) : movie.reviews.length === 0 ? (
              <p className="text-sm text-sunrise-burgundy/45">
                No reviews yet. Be the first to post, or check back after TMDB sync if this title
                has community write-ups.
              </p>
            ) : (
              movie.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-sunrise-burgundy/10 bg-sunrise-surface/80 p-4"
                >
                  <div className="flex justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold">{review.author_name}</span>
                    <span
                      className={`text-xs font-bold ${
                        review.sentiment === "Positive" ? "text-sunrise-coral" : "text-sunrise-coral-muted"
                      }`}
                    >
                      {review.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-sunrise-burgundy/85">{review.text}</p>
                  <SentimentBreakdown
                    compact
                    positive={review.positive_pct}
                    negative={review.negative_pct}
                    neutral={review.neutral_pct}
                  />
                </article>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-sunrise-burgundy/12 bg-sunrise-surface p-5 shadow-md">
            <h2 className="text-xs uppercase tracking-wider text-sunrise-burgundy/55 mb-2">
              CriticLens audience consensus
            </h2>
            <p className="text-2xl font-bold text-sunrise-coral">{movie.sentiment.overall_label}</p>
            <p className="text-xs text-sunrise-burgundy/50 mt-1 mb-1">
              {movie.sentiment.review_count} reviews · avg confidence{" "}
              {movie.sentiment.avg_confidence}%
            </p>
            {consensusHint ? (
              <p className="text-[11px] text-sunrise-burgundy/45 mb-4">{consensusHint}</p>
            ) : (
              <div className="mb-4" />
            )}
            <SentimentBreakdown
              positive={movie.sentiment.positive_pct}
              negative={movie.sentiment.negative_pct}
              neutral={movie.sentiment.neutral_pct}
            />
          </div>

          <div className="rounded-2xl border border-sunrise-burgundy/12 bg-sunrise-surface p-5 shadow-md">
            <h2 className="text-xs uppercase tracking-wider text-sunrise-burgundy/55 mb-3 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-sunrise-coral" />
              Aspect scores
            </h2>
            <AspectGauges aspects={movie.aspects} compact />
          </div>

          <div className="rounded-2xl border border-sunrise-burgundy/12 bg-sunrise-surface p-5 shadow-md">
            <h2 className="text-xs uppercase tracking-wider text-sunrise-burgundy/55 mb-3">
              Sentiment trend over time
            </h2>
            {trends.length === 0 ? (
              <p className="text-xs text-sunrise-burgundy/45 py-6 text-center">
                Trends appear after multiple review dates.
              </p>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5989b33" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg_compound" stroke="#f26c68" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <Link
            href={`/movies/compare?ids=${movie.id}`}
            className="block text-center text-sm text-sunrise-coral hover:underline"
          >
            Compare with other movies →
          </Link>
        </div>
      </div>
    </main>
  );
}
