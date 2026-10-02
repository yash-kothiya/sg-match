import type { Confidence } from "@/lib/matching/types";
import { cn } from "@/lib/utils";

const STROKE: Record<Confidence, string> = {
  excellent: "stroke-success",
  strong: "stroke-primary",
  fair: "stroke-warning",
  weak: "stroke-muted-foreground",
};

/** Circular score gauge, 0 to 100. The number is real text so screen readers get it. */
export function ScoreRing({
  score,
  confidence,
  size = 72,
  inverted = false,
}: {
  score: number;
  confidence: Confidence;
  size?: number;
  /** For dark backgrounds: white track and number, gold progress. */
  inverted?: boolean;
}) {
  const stroke = size < 56 ? 4 : 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const rounded = Math.round(score);

  return (
    <div
      role="img"
      aria-label={`Match score ${rounded} out of 100`}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={inverted ? "stroke-white/20" : "stroke-muted"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference * (1 - Math.min(Math.max(score, 0), 100) / 100)
          }
          className={cn(
            "transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none",
            inverted ? "stroke-sidebar-primary" : STROKE[confidence],
          )}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className={cn(
            "font-heading font-semibold",
            size >= 100 ? "text-4xl" : size >= 56 ? "text-xl" : "text-sm",
            inverted && "text-primary-foreground",
          )}
        >
          {rounded}
        </span>
      </span>
    </div>
  );
}
