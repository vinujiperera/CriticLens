"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Search, Star } from "lucide-react";
import {
  checkApiOnline,
  fetchMovieGenres,
  fetchMovies,
  fetchTmdbStatus,
  syncPopularMovies,
  type MovieListItem,
} from "@/lib/api";
import { GenreFilter } from "../components/GenreFilter";
import { MoviePoster } from "../components/MoviePoster";
import { SentimentBreakdown, sentimentTextClass } from "../components/SentimentBreakdown";

export default function MoviesPage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tmdbReady, setTmdbReady] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const loadMovies = useCallback(async (search?: string, genreFilter?: string | null) => {
    setLoading(true);
    try {
      const data = await fetchMovies({ query: search, genre: genreFilter });
      setMovies(data);
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const online = await checkApiOnline();
      setApiOnline(online);
      if (online) {
        const [status, genreData] = await Promise.all([fetchTmdbStatus(), fetchMovieGenres()]);
        setTmdbReady(status.configured);
        setGenres(genreData.genres);
      } else {
        setTmdbReady(false);
        setGenres([]);
      }
      setGenresLoading(false);
    })();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadMovies(query, genre);
    }, query.trim() ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [query, genre, loadMovies]);

  const handleSyncPopular = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await syncPopularMovies();
      await loadMovies(query, genre);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="flex-1 px-4 py-8 md:px-8 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sunrise-burgundy">Browse movies</h1>
          <p className="text-sm text-sunrise-burgundy/60 mt-1 max-w-2xl">
            Posters and metadata powered by TMDB. Search to import titles into CriticLens, then read
            and submit reviews with live sentiment scores.
          </p>
        </div>
        {tmdbReady && (
          <button
            type="button"
            onClick={handleSyncPopular}
            disabled={syncing}
            className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-xl border border-sunrise-burgundy/15 bg-sunrise-surface text-sm font-medium hover:border-sunrise-coral/40 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Load trending from TMDB
          </button>
        )}
      </div>

      {apiOnline === false && (
        <div className="mb-6 rounded-xl border border-sentiment-negative/30 bg-sentiment-negative/10 px-4 py-3 text-sm text-sunrise-burgundy">
          Cannot reach the API at <code className="text-xs bg-white/50 px-1 rounded">127.0.0.1:8000</code>.
          In a second terminal, activate <code className="text-xs bg-white/50 px-1 rounded">.venv</code>, run{" "}
          <code className="text-xs bg-white/50 px-1 rounded">cd backend</code> then{" "}
          <code className="text-xs bg-white/50 px-1 rounded">uvicorn main:app --reload --port 8000</code>.
        </div>
      )}

      {apiOnline && tmdbReady === false && (
        <div className="mb-6 rounded-xl border border-sunrise-coral-muted/40 bg-sunrise-peach/40 px-4 py-3 text-sm text-sunrise-burgundy">
          TMDB is not configured. Add <code className="text-xs bg-white/50 px-1 rounded">TMDB_API_KEY</code>{" "}
          to <code className="text-xs bg-white/50 px-1 rounded">backend/.env</code> and restart FastAPI.
        </div>
      )}

      {syncError && (
        <p className="mb-4 text-sm text-[#c47275]">{syncError}</p>
      )}

      <div className="relative max-w-xl mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sunrise-burgundy/40" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search TMDB & your catalog…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-sunrise-burgundy/15 bg-sunrise-surface text-sm focus:outline-none focus:ring-2 focus:ring-sunrise-coral/40"
        />
      </div>

      <GenreFilter genres={genres} value={genre} onChange={setGenre} loading={genresLoading} />

      {genre && !loading && movies.length > 0 && (
        <p className="text-xs text-sunrise-burgundy/50 -mt-3 mb-4">
          {movies.length} {genre} title{movies.length === 1 ? "" : "s"} in catalog
          {tmdbReady ? " · popular picks auto-imported from TMDB" : ""}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-sunrise-burgundy/50">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading catalog…
        </div>
      ) : movies.length === 0 ? (
        <p className="text-sm text-sunrise-burgundy/50">
          {query.trim()
            ? "No matching movies found."
            : `No movies match${genre ? ` “${genre}”` : ""}. ${
                tmdbReady
                  ? "Pick another genre, search for a title, or load trending from TMDB."
                  : "Configure TMDB to import films."
              }`}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {movies.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="group rounded-2xl border border-sunrise-burgundy/12 bg-sunrise-surface overflow-hidden shadow-md hover:shadow-lg hover:border-sunrise-coral/30 transition"
            >
              <MoviePoster
                posterUrl={movie.poster_url}
                posterAccent={movie.poster_accent}
                title={movie.title}
                genre={movie.genre}
              />
              <div className="p-4 space-y-3">
                <div>
                  <h2 className="font-bold text-sunrise-burgundy group-hover:text-sunrise-coral transition line-clamp-1">
                    {movie.title}
                  </h2>
                  <p className="text-xs text-sunrise-burgundy/55">
                    {movie.year} · {movie.director}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <Star className="w-3.5 h-3.5 text-sunrise-coral shrink-0" />
                  <span className={`font-semibold ${sentimentTextClass(movie.sentiment.overall_label)}`}>
                    {movie.sentiment.overall_label}
                  </span>
                  <span className="text-sunrise-burgundy/45">
                    ({movie.sentiment.review_count} reviews
                    {movie.audience_source === "tmdb" ? ", TMDB" : ""})
                  </span>
                </div>
                {movie.sentiment.review_count > 0 && (
                  <SentimentBreakdown
                    compact
                    positive={movie.sentiment.positive_pct}
                    negative={movie.sentiment.negative_pct}
                    neutral={movie.sentiment.neutral_pct}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
