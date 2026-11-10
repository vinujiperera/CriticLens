const TILES = [
  "from-[#5c1a2e] via-[#8b2942] to-[#3d1525]",
  "from-[#1a3a5c] via-[#2d5a87] to-[#152a45]",
  "from-[#4a2c1a] via-[#7a4a28] to-[#2f1a10]",
  "from-[#2d1a4a] via-[#4a2d75] to-[#1a102f]",
  "from-[#1a4a3a] via-[#2d7560] to-[#102f25]",
  "from-[#5c3a1a] via-[#8b5a28] to-[#3d2510]",
  "from-[#4a1a2d] via-[#752d45] to-[#2f101a]",
  "from-[#1a2d4a] via-[#2d4575] to-[#101a2f]",
  "from-[#3d2917] via-[#6b4525] to-[#251a0f]",
  "from-[#17293d] via-[#25456b] to-[#0f1a25]",
  "from-[#3d1729] via-[#6b2545] to-[#250f1a]",
  "from-[#293d17] via-[#456b25] to-[#1a250f]",
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
            className={`home-poster-tile aspect-[2/3] w-[76px] sm:w-[92px] md:w-[104px] shrink-0 rounded-md bg-gradient-to-br shadow-lg ring-1 ring-black/20 ${tileGradient(tileIndex)}`}
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
      className="home-backdrop-base pointer-events-none absolute inset-0 overflow-hidden bg-[#14060a]"
      aria-hidden
    >
      <div className="home-blob-a absolute -left-[15%] top-[5%] h-[45%] w-[45%] rounded-full bg-sunrise-coral/20 blur-3xl" />
      <div className="home-blob-b absolute -right-[10%] bottom-[0%] h-[50%] w-[50%] rounded-full bg-[#8b2942]/25 blur-3xl" />

      <div className="home-poster-wall absolute inset-[-25%] flex min-h-[150%] w-[150%] flex-col justify-center gap-1.5 sm:gap-2 -rotate-[9deg] opacity-[0.9]">
        {ROWS.map((row, i) => (
          <PosterRow key={i} rowIndex={i} {...row} />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#fff5f2]/70 via-[#fff0eb]/40 to-[#ffe8e3]/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_90%_at_50%_45%,rgba(255,250,248,0.12)_0%,rgba(255,235,230,0.5)_50%,rgba(255,228,220,0.68)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#fff5f2]/92 via-transparent to-[#fffaf8]/35" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(45,9,17,0.15)]" />
    </div>
  );
}
