"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3, Loader2, Search } from "lucide-react";
import { compareMovies, fetchMovies, type MovieListItem, type MovieSentimentSummary } from "@/lib/api";
import { SentimentBreakdown } from "../../components/SentimentBreakdown";

type CompareRow = {
  id: number;
  title: string;
  year: number;
  sentiment: MovieSentimentSummary;
};

function CompareMoviesContent() {
  const searchParams = useSearchParams();
  const initialIds = useMemo(() => {
    const raw = searchParams.get("ids");
    if (!raw) return [];
    return raw
      .split(",")
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
  }, [searchParams]);

  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<MovieListItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>(initialIds.slice(0, 3));
  const [results, setResults] = useState<CompareRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCatalog = useCallback(async (search?: string) => {
    setCatalogLoading(true);
    try {
      const data = await fetchMovies(search);
      setCatalog(data);
    } catch {
      setCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCatalog(query);
    }, query.trim() ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [query, loadCatalog]);

  useEffect(() => {
    if (initialIds.length >= 2) {
      setSelected(initialIds.slice(0, 5));
    }
  }, [initialIds]);

  const runCompare = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    try {
      const data = await compareMovies(selected);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected.length >= 2) {
      runCompare();
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  return (
    <main className="flex-1 px-4 py-8 md:px-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sunrise-burgundy flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-sunrise-coral" />
          Compare audience sentiment
        </h1>
        <p className="text-sm text-sunrise-burgundy/60 mt-1">
          Search your catalog (including titles imported from TMDB), pick 2–5 movies, then compare
          positive, negative, and neutral percentages side by side.
        </p>
      </div>

      <div className="relative max-w-xl mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sunrise-burgundy/40" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies to compare…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-sunrise-burgundy/15 bg-sunrise-surface text-sm focus:outline-none focus:ring-2 focus:ring-sunrise-coral/40"
        />
      </div>

      {catalogLoading ? (
        <div className="flex items-center gap-2 text-sm text-sunrise-burgundy/50 mb-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading titles…
        </div>
      ) : catalog.length === 0 ? (
        <p className="text-sm text-sunrise-burgundy/50 mb-6">
          No matches. Try another search or browse{" "}
          <Link href="/movies" className="text-sunrise-coral hover:underline">
            Movies
          </Link>{" "}
          to import titles from TMDB first.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {catalog.map((movie) => {
            const checked = selected.includes(movie.id);
            return (
              <div
                key={movie.id}
                className={`rounded-xl border p-3 transition ${
                  checked
                    ? "border-sunrise-coral bg-sunrise-coral/10"
                    : "border-sunrise-burgundy/12 bg-sunrise-surface hover:border-sunrise-coral/30"
                }`}
              >
                <button type="button" onClick={() => toggle(movie.id)} className="text-left w-full">
                  <p className="font-semibold text-sm">{movie.title}</p>
                  <p className="text-xs text-sunrise-burgundy/50">
                    {movie.year} · {movie.sentiment.review_count} CriticLens reviews
                  </p>
                </button>
                <Link
                  href={`/movies/${movie.id}`}
                  className="mt-2 inline-block text-xs text-sunrise-coral hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View reviews →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        disabled={selected.length < 2 || loading}
        onClick={runCompare}
        className="mb-8 px-5 py-2.5 rounded-xl bg-sunrise-coral text-white text-sm font-medium disabled:opacity-40 inline-flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Compare selected ({selected.length})
      </button>

      {results.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5">
          {results.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-sunrise-burgundy/12 bg-sunrise-surface p-5 shadow-md"
            >
              <h2 className="font-bold text-lg">{row.title}</h2>
              <p className="text-xs text-sunrise-burgundy/50 mb-1">{row.year}</p>
              <p className="text-sm font-semibold text-sunrise-coral mb-3">
                {row.sentiment.overall_label} · {row.sentiment.review_count} reviews
              </p>
              <SentimentBreakdown
                positive={row.sentiment.positive_pct}
                negative={row.sentiment.negative_pct}
                neutral={row.sentiment.neutral_pct}
              />
              <Link
                href={`/movies/${row.id}`}
                className="mt-4 inline-block text-sm text-sunrise-coral hover:underline"
              >
                Open movie page →
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function CompareMoviesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sunrise-coral" />
        </main>
      }
    >
      <CompareMoviesContent />
    </Suspense>
  );
}
