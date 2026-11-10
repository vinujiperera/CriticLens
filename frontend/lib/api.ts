export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://127.0.0.1:8000";

async function apiFetch(input: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(input, { ...init, cache: "no-store" });
  } catch {
    return null;
  }
}

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

export type MovieAspectScores = {
  "Acting & Cast": number;
  "Story & Writing": number;
  "Visuals & Audio": number;
  "Pacing & Direction": number;
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
  audience_source?: "criticlens" | "tmdb" | "none";
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

export type AudienceFeedReview = {
  author: string;
  text: string;
  created_at: string | null;
  sentiment: string;
  confidence: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  aspects: Record<string, number | null>;
  source: string;
};

export type MovieCastMember = {
  name: string;
  character: string | null;
  profile_url: string | null;
};

export type MoviePageDetails = {
  tagline: string | null;
  runtime_minutes: number | null;
  genres: string[];
  cast: MovieCastMember[];
  backdrop_url: string | null;
  vote_average: number | null;
  release_date: string | null;
};

export type MovieDetail = MovieListItem & {
  reviews: MovieReview[];
  aspects: MovieAspectScores;
  audience_feed: AudienceFeedReview[];
  details?: MoviePageDetails;
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
  const res = await apiFetch(`${API_BASE}/tmdb/status`);
  if (!res?.ok) return { configured: false };
  return res.json();
}

export async function checkApiOnline(): Promise<boolean> {
  const res = await apiFetch(`${API_BASE}/tmdb/status`);
  return res?.ok ?? false;
}

export async function syncPopularMovies(): Promise<{ tmdb_movies_in_catalog: number }> {
  const res = await fetch(`${API_BASE}/movies/sync/popular`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "TMDB sync failed");
  }
  return res.json();
}

export type MovieBrowseFilters = {
  query?: string;
  genre?: string | null;
};

export async function fetchMovieGenres(): Promise<{ genres: string[]; in_catalog: string[] }> {
  const res = await apiFetch(`${API_BASE}/movies/genres`);
  if (!res?.ok) return { genres: [], in_catalog: [] };
  return res.json();
}

export async function fetchMovies(filters?: MovieBrowseFilters): Promise<MovieListItem[]> {
  const params = new URLSearchParams();
  if (filters?.query?.trim()) params.set("q", filters.query.trim());
  if (filters?.genre?.trim()) params.set("genre", filters.genre.trim());
  const qs = params.toString();
  const url = qs ? `${API_BASE}/movies?${qs}` : `${API_BASE}/movies`;
  const res = await apiFetch(url);
  if (!res?.ok) return [];
  return res.json();
}

export async function fetchMovie(id: number): Promise<MovieDetail> {
  const res = await fetch(`${API_BASE}/movies/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Movie not found");
  return res.json();
}

export type DriverWord = { word: string; weight: number };

export type MovieDossier = {
  generated_at: string;
  movie: {
    id: number;
    title: string;
    year: number;
    director: string;
    genre: string;
    poster_url: string | null;
  };
  audience_source: string;
  sentiment: MovieSentimentSummary;
  aspects: MovieAspectScores;
  consensus_blurb: string;
  driver_words: {
    positive: DriverWord[];
    negative: DriverWord[];
  };
};

export async function fetchMovieDossier(id: number): Promise<MovieDossier> {
  const res = await fetch(`${API_BASE}/movies/${id}/dossier`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load dossier");
  return res.json();
}

export type ReviewReportPayload = {
  context_title: string;
  context_subtitle: string;
  author: string;
  review_text: string;
  sentiment: string;
  confidence: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  aspects: Record<string, number | null>;
  driver_words: {
    positive: DriverWord[];
    negative: DriverWord[];
  };
  timestamp: string | null;
};

export async function fetchMovieReviewReport(
  movieId: number,
  reviewId: number
): Promise<ReviewReportPayload> {
  const res = await fetch(`${API_BASE}/movies/${movieId}/reviews/${reviewId}/report`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load review report");
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

export type CompareMovieRow = {
  id: number;
  title: string;
  year: number;
  poster_url?: string | null;
  sentiment: MovieSentimentSummary;
  aspects: MovieAspectScores;
};

export async function compareMovies(ids: number[]) {
  const res = await fetch(`${API_BASE}/movies/compare?ids=${ids.join(",")}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Compare failed");
  return res.json() as Promise<CompareMovieRow[]>;
}

export type AiParsedIntent = {
  genres?: string[];
  people?: string[];
  keywords?: string[];
  year?: number | null;
};

export type AiMovieResult = {
  id: number;
  title: string;
  overview: string;
  poster_path?: string | null;
  poster_url?: string | null;
  release_date: string;
  vote_average: number;
};

export type AiDiscoverResponse = {
  query_parsed: AiParsedIntent;
  results_count: number;
  movies: AiMovieResult[];
};

export function resolveAiMoviePoster(movie: AiMovieResult): string | null {
  if (movie.poster_url) return movie.poster_url;
  if (movie.poster_path) {
    const path = movie.poster_path.startsWith("/")
      ? movie.poster_path
      : `/${movie.poster_path}`;
    return `https://image.tmdb.org/t/p/w500${path}`;
  }
  return null;
}

export async function fetchAiMovieDiscover(prompt: string): Promise<AiDiscoverResponse> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return {
      query_parsed: { genres: [], people: [], keywords: [], year: null },
      results_count: 0,
      movies: [],
    };
  }

  const res = await apiFetch(`${API_BASE}/movies/ai-discover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: trimmed }),
  });

  if (!res?.ok) {
    const err = await res?.json().catch(() => ({}));
    const detail = err?.detail;
    throw new Error(typeof detail === "string" ? detail : "AI search failed");
  }

  const data = (await res.json()) as Partial<AiDiscoverResponse>;
  return {
    query_parsed: data.query_parsed ?? { genres: [], people: [], keywords: [], year: null },
    results_count: data.results_count ?? data.movies?.length ?? 0,
    movies: Array.isArray(data.movies) ? data.movies : [],
  };
}
