import { InfoIcon } from "lucide-react";
import type { MatchesResponse } from "@/schemas/matching";

/** "How scoring works": built from the same weights the engine uses, so it can't drift from the code. */
export function ScoringExplainer({
  method,
  considered,
  bare = false,
}: {
  method: MatchesResponse["method"];
  considered?: number;
  /** Drop the card chrome and heading, for use inside a drawer that has its own title. */
  bare?: boolean;
}) {
  return (
    <section
      aria-label="How scoring works"
      className={bare ? undefined : "rounded-2xl border bg-card p-5 shadow-sm"}
    >
      {!bare && (
        <h2 className="mb-1 flex items-center gap-2 font-sans text-sm font-semibold">
          <InfoIcon className="size-4 text-primary" aria-hidden />
          How scoring works
        </h2>
      )}
      <p className="mb-4 text-xs text-muted-foreground">
        Every group earns up to 100 points across six signals. Full groups and
        groups you already belong to are left out.
        {considered !== undefined &&
          ` ${considered} groups were scored for this request.`}
      </p>
      <ul className="flex flex-col gap-3">
        {method.map((signal) => (
          <li key={signal.key} className="text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{signal.label}</span>
              <span className="text-xs font-semibold text-primary tabular-nums">
                {signal.weight} pts
              </span>
            </div>
            <div
              aria-hidden
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${signal.weight}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{signal.rule}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
