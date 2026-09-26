export function sentimentTextClass(sentiment: string): string {
  if (sentiment === "Positive") return "text-sentiment-positive";
  if (sentiment === "Negative") return "text-sentiment-negative";
  if (sentiment === "Mixed") return "text-amber-700";
  return "text-sunrise-burgundy/70";
}

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
      <div
        className={`flex overflow-hidden rounded-full bg-sunrise-peach/50 border border-sunrise-burgundy/10 ${compact ? "h-2" : "h-2.5"}`}
      >
        <div
          className="bg-sentiment-positive transition-all"
          style={{ width: `${positive}%` }}
          title={`Positive ${positive}%`}
        />
        <div
          className="bg-sentiment-negative transition-all"
          style={{ width: `${negative}%` }}
          title={`Negative ${negative}%`}
        />
        <div
          className="bg-sunrise-burgundy/15 transition-all"
          style={{ width: `${neutral}%` }}
          title={`Neutral ${neutral}%`}
        />
      </div>
      <div className={`flex justify-between ${compact ? "text-[10px]" : "text-xs"}`}>
        <span className="text-sentiment-positive font-medium">+ {positive.toFixed(1)}%</span>
        <span className="text-sentiment-negative font-medium">− {negative.toFixed(1)}%</span>
        <span className="text-sunrise-burgundy/60">○ {neutral.toFixed(1)}%</span>
      </div>
    </div>
  );
}
