import Image from "next/image";

type MovieDetailHeroProps = {
  title: string;
  genre: string;
  posterUrl?: string | null;
  posterAccent?: string;
  backdropUrl?: string | null;
};

const ACCENT: Record<string, string> = {
  coral: "from-sunrise-coral to-[#e85f5b]",
  burgundy: "from-sunrise-burgundy to-[#4a1520]",
  peach: "from-[#fbc9bf] to-sunrise-coral-muted",
};

export function MovieDetailHero({
  title,
  genre,
  posterUrl,
  posterAccent = "coral",
  backdropUrl,
}: MovieDetailHeroProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-sunrise-burgundy/12 shadow-lg min-h-[220px] sm:min-h-[280px]">
      {backdropUrl ? (
        <Image
          src={backdropUrl}
          alt=""
          fill
          priority
          className="object-cover object-top"
          sizes="100vw"
          quality={90}
        />
      ) : posterUrl ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          priority
          className="object-cover blur-sm scale-105"
          sizes="100vw"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${ACCENT[posterAccent] ?? ACCENT.coral}`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-sunrise-burgundy/85 via-sunrise-burgundy/55 to-sunrise-burgundy/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-sunrise-burgundy/90 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col sm:flex-row gap-5 sm:gap-8 p-5 sm:p-8 items-end sm:items-end">
        <div className="relative w-[140px] sm:w-[168px] shrink-0 rounded-xl overflow-hidden border-2 border-white/25 shadow-2xl aspect-[2/3] self-center sm:self-end">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={`${title} poster`}
              fill
              priority
              className="object-cover"
              sizes="168px"
              quality={90}
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${ACCENT[posterAccent] ?? ACCENT.coral}`}
            />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left pb-1 min-w-0">
          <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-white/80 bg-white/10 px-2 py-0.5 rounded mb-2">
            {genre}
          </span>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-sm">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}
