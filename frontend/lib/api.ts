export const API_BASE = "http://127.0.0.1:8000";

export type MovieSentimentSummary = {
  review_count: number;
  overall_label: string;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  avg_confidence: number;
  positive_count?: number;
  negative_count?: number;
};

export type MovieListItem = {
  id: number;
  tmdb_id?: number | null;
  title: string;
  year: number;
  director: string;
  genre: string;
  synopsis: string;
  poster_accent: string;
  poster_path?: string | null;
  poster_url?: string | null;
  sentiment: MovieSentimentSummary;
};

export type MovieReview = {
  id: number;
  author_name: string;
  text: string;
  sentiment: string;
  confidence: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  vader_compound: number;
  timestamp: string | null;
};

export type MovieDetail = MovieListItem & {
  reviews: MovieReview[];
};

export type CommunityReview = {
  author: string;
  text: string;
  created_at: string | null;
  sentiment: string;
  confidence: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  source: string;
};

export type CommunityReviewsResponse = {
  reviews: CommunityReview[];
  configured: boolean;
  source: string;
};

export type SentimentTrendPoint = {
  date: string;
  avg_compound: number;
  review_count: number;
};

export async function fetchTmdbStatus(): Promise<{ configured: boolean }> {
  const res = await fetch(`${API_BASE}/tmdb/status`, { cache: "no-store" });
  if (!res.ok) return { configured: false };
  return res.json();
}

export async function syncPopularMovies(): Promise<{ tmdb_movies_in_catalog: number }> {
  const res = await fetch(`${API_BASE}/movies/sync/popular`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "TMDB sync failed");
  }
  return res.json();
}

export async function fetchMovies(query?: string): Promise<MovieListItem[]> {
  const url = query?.trim()
    ? `${API_BASE}/movies?q=${encodeURIComponent(query.trim())}`
    : `${API_BASE}/movies`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load movies");
  return res.json();
}

export async function fetchMovie(id: number): Promise<MovieDetail> {
  const res = await fetch(`${API_BASE}/movies/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Movie not found");
  return res.json();
}

export async function fetchMovieTrends(id: number): Promise<SentimentTrendPoint[]> {
  const res = await fetch(`${API_BASE}/movies/${id}/sentiment/trends`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load trends");
  return res.json();
}

export async function fetchCommunityReviews(movieId: number): Promise<CommunityReviewsResponse> {
  const res = await fetch(`${API_BASE}/movies/${movieId}/community-reviews`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return { reviews: [], configured: false, source: "tmdb" };
  }
  return res.json();
}

export async function submitMovieReview(
  movieId: number,
  text: string,
  authorName?: string
) {
  const res = await fetch(`${API_BASE}/movies/${movieId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, author_name: authorName || "Anonymous" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit review");
  }
  return res.json();
}

export async function compareMovies(ids: number[]) {
  const res = await fetch(`${API_BASE}/movies/compare?ids=${ids.join(",")}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Compare failed");
  return res.json() as Promise<
    { id: number; title: string; year: number; sentiment: MovieSentimentSummary }[]
  >;
}
