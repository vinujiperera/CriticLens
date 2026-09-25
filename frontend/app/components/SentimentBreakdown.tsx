export function SentimentBreakdown({
  positive,
  negative,
  neutral,
  compact,
}: {
  positive: number;
  negative: number;
  neutral: number;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className={`flex overflow-hidden rounded-full bg-sunrise-peach/50 border border-sunrise-burgundy/10 ${compact ? "h-2" : "h-2.5"}`}>
        <div className="bg-sunrise-coral transition-all" style={{ width: `${positive}%` }} title={`Positive ${positive}%`} />
        <div className="bg-sunrise-coral-muted/80 transition-all" style={{ width: `${negative}%` }} title={`Negative ${negative}%`} />
        <div className="bg-sunrise-burgundy/15 transition-all" style={{ width: `${neutral}%` }} title={`Neutral ${neutral}%`} />
      </div>
      <div className={`flex justify-between text-sunrise-burgundy/60 ${compact ? "text-[10px]" : "text-xs"}`}>
        <span className="text-sunrise-coral">+ {positive.toFixed(1)}%</span>
        <span className="text-[#c47275]">− {negative.toFixed(1)}%</span>
        <span>○ {neutral.toFixed(1)}%</span>
      </div>
    </div>
  );
}
