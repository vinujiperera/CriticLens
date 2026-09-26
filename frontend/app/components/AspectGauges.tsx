export type AspectScores = Record<string, number | null>;

export function AspectGauges({
  aspects,
  compact = false,
}: {
  aspects: Record<string, number>;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      {Object.entries(aspects).map(([aspect, score]) => (
        <div key={aspect}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-sunrise-burgundy font-medium">{aspect}</span>
            <span className="font-mono text-[11px] text-sunrise-burgundy/60">{score}%</span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-sunrise-peach/50 border border-sunrise-burgundy/10 overflow-hidden">
            <div
              className="absolute top-0 bottom-0 w-px bg-sunrise-burgundy/25 z-10"
              style={{ left: "50%" }}
              aria-hidden
            />
            <div
              className={`absolute top-0 bottom-0 transition-all duration-700 ease-out ${
                score >= 50 ? "bg-sunrise-coral" : "bg-sunrise-coral-muted"
              }`}
              style={
                score >= 50
                  ? { left: "50%", width: `${Math.min(score - 50, 50)}%` }
                  : { left: `${Math.max(score, 0)}%`, width: `${50 - score}%` }
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
