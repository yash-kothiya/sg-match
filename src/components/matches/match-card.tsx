import { CheckIcon, ChevronRightIcon, Loader2Icon, MapPinIcon, TriangleAlertIcon, UsersIcon } from "lucide-react";
import { CONFIDENCE_STYLES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { levelLabel, modeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { MatchItem } from "@/schemas/matching";
import { ScoreRing } from "./score-ring";

const MAX_REASONS_SHOWN = 2;

/** The essentials only: who, how well it fits, the top reasons. Everything else is in "Full breakdown". */
export function MatchCard({
  match,
  rank,
  onOpen,
  onJoin,
  onCancelJoin,
  joinBusy,
}: {
  match: MatchItem;
  rank: number;
  onOpen: () => void;
  onJoin: () => void;
  onCancelJoin: () => void;
  joinBusy: boolean;
}) {
  const style = CONFIDENCE_STYLES[match.confidence];
  const { group } = match;
  const best = rank === 1;
  const hidden = match.reasons.length - MAX_REASONS_SHOWN;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        best && "ring-2 ring-sidebar-primary",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <ScoreRing score={match.score} confidence={match.confidence} size={64} />
        <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">#{rank}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", style.chip)}>{style.label}</span>
            {best && (
              <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-[11px] font-semibold text-sidebar-primary-foreground">
                Best match
              </span>
            )}
          </div>
          <h3 className="font-heading text-xl leading-snug font-semibold">
            <button
              type="button"
              onClick={onOpen}
              className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {group.name}
            </button>
          </h3>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            {group.subject} · {levelLabel(group.level)} · {modeLabel(group.mode)}
            {group.location && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="size-3.5" aria-hidden />
                {group.location}
              </span>
            )}
          </p>
        </div>
        {/* relative z-10 keeps this clickable above the card's full-surface "open" overlay */}
        <div className="relative z-10 flex shrink-0 flex-col items-end gap-1 max-sm:w-full max-sm:items-stretch">
          {group.joinStatus === "pending" ? (
            <>
              <span className="inline-flex items-center justify-end gap-1.5 text-sm font-medium text-success">
                <CheckIcon className="size-4" aria-hidden />
                Request sent
              </span>
              <Button variant="ghost" size="sm" onClick={onCancelJoin} disabled={joinBusy}>
                {joinBusy && <Loader2Icon className="animate-spin" aria-hidden />}
                Cancel request
              </Button>
            </>
          ) : (
            <Button onClick={onJoin} disabled={joinBusy}>
              {joinBusy && <Loader2Icon className="animate-spin" aria-hidden />}
              Request to join
            </Button>
          )}
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {match.reasons.slice(0, MAX_REASONS_SHOWN).map((reason) => (
          <li key={reason} className="flex items-start gap-2.5 text-sm">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {reason}
          </li>
        ))}
        {match.caveats[0] && (
          <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            {match.caveats[0]}
          </li>
        )}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <UsersIcon className="size-4" aria-hidden />
          {group.spotsLeft === 1 ? "1 spot left" : `${group.spotsLeft} spots left`}
        </span>
        <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary">
          Full breakdown
          {hidden > 0 && <span className="font-normal text-muted-foreground">(+{hidden})</span>}
          <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </article>
  );
}
