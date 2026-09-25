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

export function PosterBackdrop() {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#ffe8e3] via-[#ffd4cc] to-[#ffc9bf]"
      aria-hidden
    >
      <div className="absolute -left-[20%] top-[10%] h-[55%] w-[55%] rounded-full bg-sunrise-coral/25 blur-3xl" />
      <div className="absolute -right-[15%] bottom-[5%] h-[50%] w-[50%] rounded-full bg-[#e5989b]/35 blur-3xl" />
      <div className="absolute left-1/2 top-[35%] h-[40%] w-[70%] -translate-x-1/2 rounded-full bg-[#f26c68]/15 blur-[80px]" />

      <div
        className="absolute left-1/2 top-1/2 w-[160%] min-w-[900px] -translate-x-1/2 -translate-y-[42%] -rotate-[8deg] opacity-50"
        style={{ transformOrigin: "center center" }}
      >
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-2.5">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-[2/3] rounded-sm bg-gradient-to-br ${TILES[i % TILES.length]} shadow-md ring-1 ring-sunrise-burgundy/10`}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-[#fff0eb]/75 to-[#ffe4dc]/85" />
      <div className="absolute inset-0 bg-gradient-to-tr from-sunrise-coral/8 via-transparent to-[#e5989b]/12" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/35 via-transparent to-white/35" />
    </div>
  );
}
