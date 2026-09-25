import Image from "next/image";

const ACCENT: Record<string, string> = {
  coral: "from-sunrise-coral to-[#e85f5b]",
  burgundy: "from-sunrise-burgundy to-[#4a1520]",
  peach: "from-[#fbc9bf] to-sunrise-coral-muted",
};

type MoviePosterProps = {
  posterUrl?: string | null;
  posterAccent?: string;
  title: string;
  genre?: string;
  className?: string;
};

export function MoviePoster({
  posterUrl,
  posterAccent = "coral",
  title,
  genre,
  className = "h-36",
}: MoviePosterProps) {
  return (
    <div className={`relative overflow-hidden bg-sunrise-burgundy/20 ${className}`}>
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={`${title} poster`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${ACCENT[posterAccent] ?? ACCENT.coral}`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {genre && (
        <span className="absolute bottom-3 left-3 text-xs font-mono uppercase tracking-wider text-white/90 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
          {genre}
        </span>
      )}
    </div>
  );
}
