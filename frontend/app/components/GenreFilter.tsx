"use client";

type GenreFilterProps = {
  genres: string[];
  value: string | null;
  onChange: (genre: string | null) => void;
  loading?: boolean;
};

export function GenreFilter({ genres, value, onChange, loading }: GenreFilterProps) {
  if (loading) {
    return (
      <p className="text-xs text-sunrise-burgundy/45 mb-4">Loading genres…</p>
    );
  }

  if (genres.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-wider font-semibold text-sunrise-burgundy/55 mb-2">
        Browse by genre
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            value === null
              ? "border-sunrise-coral bg-sunrise-coral/15 text-sunrise-burgundy"
              : "border-sunrise-burgundy/15 bg-sunrise-surface text-sunrise-burgundy/70 hover:border-sunrise-coral/35"
          }`}
        >
          All
        </button>
        {genres.map((genre) => {
          const active = value === genre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onChange(active ? null : genre)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                active
                  ? "border-sunrise-coral bg-sunrise-coral/15 text-sunrise-burgundy"
                  : "border-sunrise-burgundy/15 bg-sunrise-surface text-sunrise-burgundy/70 hover:border-sunrise-coral/35"
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
