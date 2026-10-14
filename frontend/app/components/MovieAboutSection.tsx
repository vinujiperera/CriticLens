import Image from "next/image";
import { Clock, Film, Star, User } from "lucide-react";
import type { MovieCastMember, MoviePageDetails } from "@/lib/api";

function formatRuntime(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function MovieAboutSection({
  synopsis,
  director,
  year,
  details,
}: {
  synopsis: string;
  director: string;
  year: number;
  details: MoviePageDetails;
}) {
  const runtime = formatRuntime(details.runtime_minutes);
  const genres = details.genres?.length ? details.genres : [];

  return (
    <section className="space-y-6">
      {details.tagline ? (
        <p className="text-base sm:text-lg text-sunrise-burgundy/70 italic border-l-2 border-sunrise-coral/50 pl-4">
          {details.tagline}
        </p>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-sunrise-burgundy mb-2">Overview</h2>
        <p className="text-sm sm:text-base leading-relaxed text-sunrise-burgundy/85 whitespace-pre-line">
          {synopsis}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetaTile icon={User} label="Director" value={director} />
        <MetaTile icon={Film} label="Release" value={String(year)} />
        {runtime ? <MetaTile icon={Clock} label="Runtime" value={runtime} /> : null}
        {details.vote_average != null ? (
          <MetaTile icon={Star} label="TMDB score" value={`${details.vote_average}/10`} />
        ) : null}
      </div>

      {genres.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-sunrise-burgundy/55 mb-2">Genres</p>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <span
                key={g}
                className="text-xs px-2.5 py-1 rounded-full border border-sunrise-burgundy/15 bg-sunrise-peach/30 text-sunrise-burgundy"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {details.cast && details.cast.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-sunrise-burgundy mb-3">Cast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {details.cast.map((member) => (
              <CastCard key={`${member.name}-${member.character}`} member={member} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-sunrise-burgundy/10 bg-sunrise-surface/80 p-3">
      <Icon className="w-3.5 h-3.5 text-sunrise-coral mb-1.5" />
      <p className="text-[10px] uppercase tracking-wide text-sunrise-burgundy/50">{label}</p>
      <p className="text-sm font-medium text-sunrise-burgundy mt-0.5 line-clamp-2">{value}</p>
    </div>
  );
}

function CastCard({ member }: { member: MovieCastMember }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-sunrise-burgundy/10 bg-sunrise-surface/80 p-2.5">
      <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-sunrise-peach/40">
        {member.profile_url ? (
          <Image src={member.profile_url} alt="" fill className="object-cover" sizes="48px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sunrise-burgundy/35 text-xs font-bold">
            {member.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-sunrise-burgundy truncate">{member.name}</p>
        {member.character ? (
          <p className="text-[10px] text-sunrise-burgundy/55 truncate">as {member.character}</p>
        ) : null}
      </div>
    </div>
  );
}
