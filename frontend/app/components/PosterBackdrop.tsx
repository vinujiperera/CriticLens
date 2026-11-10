/** Poster tiles — sunrise palette (burgundy, coral, peach, wine) only */
const TILES = [
  "from-[#2d0911] via-[#4a1520] to-[#1a050a]",
  "from-[#5c1a2e] via-[#8b2942] to-[#3d1525]",
  "from-[#6b2435] via-[#994d62] to-[#4a1a28]",
  "from-[#8b3a38] via-[#c47275] to-[#5c2828]",
  "from-[#a84842] via-[#e5989b] to-[#6b3535]",
  "from-[#b84848] via-[#f26c68] to-[#8f3a38]",
  "from-[#9e3d4a] via-[#e85f5b] to-[#6b2530]",
  "from-[#4a2428] via-[#7a4548] to-[#2d1215]",
  "from-[#3d1724] via-[#752d45] to-[#250f18]",
  "from-[#5c3832] via-[#9a6a5a] to-[#3d2520]",
  "from-[#7a4540] via-[#d4847f] to-[#4a2a28]",
  "from-[#3d1520] via-[#6b2d35] to-[#2d0911]",
];

const ROWS: { duration: number; direction: "left" | "right"; offset: number }[] = [
  { duration: 52, direction: "left", offset: 0 },
  { duration: 62, direction: "right", offset: 3 },
  { duration: 48, direction: "left", offset: 6 },
  { duration: 58, direction: "right", offset: 2 },
  { duration: 54, direction: "left", offset: 5 },
  { duration: 66, direction: "right", offset: 1 },
  { duration: 50, direction: "left", offset: 4 },
  { duration: 60, direction: "right", offset: 7 },
];

const TILES_PER_ROW = 18;

function tileGradient(index: number) {
  return TILES[index % TILES.length];
}

function PosterRow({
  duration,
  direction,
  offset,
  rowIndex,
}: {
  duration: number;
  direction: "left" | "right";
  offset: number;
  rowIndex: number;
}) {
  const items = Array.from({ length: TILES_PER_ROW }, (_, i) => i + offset + rowIndex * 2);
  const track = [...items, ...items];

  return (
    <div className="w-full overflow-hidden py-0.5">
      <div
        className={`home-marquee-track flex w-max gap-2 sm:gap-2.5 ${
          direction === "left" ? "home-marquee-left" : "home-marquee-right"
        }`}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {track.map((tileIndex, i) => (
          <div
            key={`${rowIndex}-${i}`}
            className={`home-poster-tile aspect-[2/3] w-[76px] sm:w-[92px] md:w-[104px] shrink-0 rounded-md bg-gradient-to-br shadow-lg ring-1 ring-[#2d0911]/25 ${tileGradient(tileIndex)}`}
            style={{ animationDelay: `${(i % 10) * 0.25}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function PosterBackdrop() {
  return (
    <div
      className="home-backdrop-base pointer-events-none absolute inset-0 overflow-hidden bg-[#1f0a0e]"
      aria-hidden
    >
      <div className="home-blob-a absolute -left-[15%] top-[5%] h-[45%] w-[45%] rounded-full bg-[#f26c68]/30 blur-3xl" />
      <div className="home-blob-b absolute -right-[10%] bottom-[0%] h-[50%] w-[50%] rounded-full bg-[#e5989b]/28 blur-3xl" />

      <div className="home-poster-wall absolute inset-[-25%] flex min-h-[150%] w-[150%] flex-col justify-center gap-1.5 sm:gap-2 -rotate-[9deg]">
        {ROWS.map((row, i) => (
          <PosterRow key={i} rowIndex={i} {...row} />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#fff0ed]/50 via-[#ffe8e3]/30 to-[#ffddd6]/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_80%_at_50%_36%,rgba(255,245,242,0.72)_0%,rgba(255,232,227,0.35)_50%,rgba(255,220,212,0.15)_75%,transparent_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#fff0ed]/85 via-[#fff5f2]/20 to-transparent" />
    </div>
  );
}
